import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNarration } from "../src/narration.ts";
import type { Medication } from "../src/types.ts";

function med(overrides: Partial<Medication>): Medication {
  return {
    id: 1,
    name: "Panadol",
    dosage: "500mg",
    quantity: "1 goli",
    instructions: "khane ke baad lein",
    slot: "morning",
    active: true,
    ...overrides,
  };
}

test("narrates a single medicine verbatim with dosage and instructions", () => {
  const text = buildNarration("morning", [med({})]);
  assert.match(text, /Panadol, 500mg, 1 goli\. khane ke baad lein\./);
  assert.match(text, /^Assalam-o-Alaikum\./);
  assert.match(text, /Yeh sirf yaad dahani hai, tibbi mashwara nahi\./);
});

test("narrates multiple medicines in order", () => {
  const meds = [med({ id: 1, name: "Panadol" }), med({ id: 2, name: "Metformin" })];
  const text = buildNarration("evening", meds);
  const panadolIndex = text.indexOf("Panadol");
  const metforminIndex = text.indexOf("Metformin");
  assert.ok(panadolIndex > -1 && metforminIndex > -1);
  assert.ok(panadolIndex < metforminIndex);
});

test("says nothing scheduled when the slot has no active medicines", () => {
  const text = buildNarration("morning", []);
  assert.match(text, /koi dawai darj nahi hai/);
});

test("never invents dosage text not present in the stored record", () => {
  const text = buildNarration("morning", [med({ dosage: "2 tablets, 250mg each" })]);
  assert.match(text, /2 tablets, 250mg each/);
});

test("omits instructions sentence entirely when none are stored", () => {
  const text = buildNarration("morning", [med({ instructions: "" })]);
  assert.doesNotMatch(text, /\. \./);
});
