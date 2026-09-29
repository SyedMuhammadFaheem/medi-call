import { test } from "node:test";
import assert from "node:assert/strict";
import { timeToCronExpression } from "../src/scheduler.ts";

test("converts HH:mm into a daily cron expression", () => {
  assert.equal(timeToCronExpression("08:00"), "0 8 * * *");
  assert.equal(timeToCronExpression("20:30"), "30 20 * * *");
  assert.equal(timeToCronExpression("00:05"), "5 0 * * *");
});

test("rejects malformed or out-of-range times", () => {
  assert.throws(() => timeToCronExpression("8:00am"));
  assert.throws(() => timeToCronExpression("25:00"));
  assert.throws(() => timeToCronExpression("12:60"));
  assert.throws(() => timeToCronExpression("not-a-time"));
});
