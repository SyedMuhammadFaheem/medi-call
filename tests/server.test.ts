import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import twilio from "twilio";
import { openDatabase } from "../src/db.ts";
import { createSqliteCallLogRepository } from "../src/repositories/callLogRepository.ts";
import { createSqliteMedicationRepository } from "../src/repositories/medicationRepository.ts";
import { createServer } from "../src/server.ts";

const AUTH_TOKEN = "test-twilio-token";
const ADMIN_PASSWORD = "pa:ss word"; // contains ":" on purpose
const adminHeader = `Basic ${Buffer.from(`admin:${ADMIN_PASSWORD}`).toString("base64")}`;

async function withServer(run: (base: string) => Promise<void>) {
  const db = openDatabase(":memory:");
  const app = createServer({
    medicationRepository: createSqliteMedicationRepository(db),
    callLogRepository: createSqliteCallLogRepository(db),
    textToSpeechProvider: { toSpeechInstruction: (text) => ({ voice: "v", language: "l", text }) },
    adminPassword: ADMIN_PASSWORD,
    twilioAuthToken: AUTH_TOKEN,
    publicBaseUrl: "https://example.test",
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

function signedTwilioPost(base: string, path: string, params: Record<string, string> = {}) {
  const signature = twilio.getExpectedTwilioSignature(AUTH_TOKEN, `${base}${path}`, params);
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "X-Twilio-Signature": signature, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
}

const medicine = { name: "Panadol", dosage: "500mg", quantity: "1 goli", instructions: "", slot: "morning", active: true };

test("admin API rejects missing or wrong credentials", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/api/medications`)).status, 401);
    const wrong = `Basic ${Buffer.from("admin:nope").toString("base64")}`;
    assert.equal((await fetch(`${base}/api/medications`, { headers: { Authorization: wrong } })).status, 401);
    assert.equal((await fetch(`${base}/api/medications`, { headers: { Authorization: adminHeader } })).status, 200);
  });
});

test("medication API validates input and 404s on unknown ids", async () => {
  await withServer(async (base) => {
    const headers = { Authorization: adminHeader, "Content-Type": "application/json" };
    const bad = await fetch(`${base}/api/medications`, { method: "POST", headers, body: JSON.stringify({ ...medicine, slot: "noon" }) });
    assert.equal(bad.status, 400);
    const missing = await fetch(`${base}/api/medications/999`, { method: "PUT", headers, body: JSON.stringify(medicine) });
    assert.equal(missing.status, 404);
  });
});

test("webhooks reject unsigned requests", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/twiml/morning`, { method: "POST" })).status, 400);
    const forged = await fetch(`${base}/twiml/morning`, { method: "POST", headers: { "X-Twilio-Signature": "forged" } });
    assert.equal(forged.status, 403);
  });
});

test("signed webhook narrates the stored medicines for the slot", async () => {
  await withServer(async (base) => {
    const headers = { Authorization: adminHeader, "Content-Type": "application/json" };
    await fetch(`${base}/api/medications`, { method: "POST", headers, body: JSON.stringify(medicine) });
    const res = await signedTwilioPost(base, "/twiml/morning");
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Panadol, 500mg, 1 goli/);
  });
});

test("signed webhook 404s on an unknown slot instead of narrating", async () => {
  await withServer(async (base) => {
    assert.equal((await signedTwilioPost(base, "/twiml/bogus")).status, 404);
  });
});

test("status callback records the call outcome", async () => {
  await withServer(async (base) => {
    const res = await signedTwilioPost(base, "/twiml/status/evening", { CallStatus: "no-answer", CallSid: "CA123" });
    assert.equal(res.status, 204);
    const log = await (await fetch(`${base}/api/call-log`, { headers: { Authorization: adminHeader } })).json();
    assert.equal(log[0].status, "failed");
    assert.equal(log[0].error, "no-answer");
  });
});
