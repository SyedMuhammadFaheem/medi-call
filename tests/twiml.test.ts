import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTwiml } from "../src/telephony/twiml.ts";

test("builds a Say verb with the configured voice and language", () => {
  const xml = buildTwiml({ voice: "Polly.Kajal-Neural", language: "hi-IN", text: "hello" });
  assert.match(xml, /<Say voice="Polly.Kajal-Neural" language="hi-IN">hello<\/Say>/);
});

test("escapes special XML characters in narration text", () => {
  const xml = buildTwiml({
    voice: "Polly.Kajal-Neural",
    language: "hi-IN",
    text: "Panadol & Brufen < 2 tablets",
  });
  assert.match(xml, /Panadol &amp; Brufen &lt; 2 tablets/);
  assert.doesNotMatch(xml, /Panadol & Brufen/);
});
