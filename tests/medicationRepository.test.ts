import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/db.ts";
import { createSqliteMedicationRepository } from "../src/repositories/medicationRepository.ts";
import type { NewMedication } from "../src/types.ts";

function newRepo() {
  const db = openDatabase(":memory:");
  return createSqliteMedicationRepository(db);
}

const sample: NewMedication = {
  name: "Panadol",
  dosage: "500mg",
  quantity: "1 goli",
  instructions: "khane ke baad",
  slot: "morning",
  active: true,
};

test("creates and lists a medication", () => {
  const repo = newRepo();
  const created = repo.create(sample);
  assert.ok(created.id > 0);
  assert.deepEqual(repo.listAll(), [created]);
});

test("listForSlot returns only matching slot or 'both', and only active", () => {
  const repo = newRepo();
  repo.create({ ...sample, name: "Morning med", slot: "morning" });
  repo.create({ ...sample, name: "Evening med", slot: "evening" });
  repo.create({ ...sample, name: "Both med", slot: "both" });
  repo.create({ ...sample, name: "Inactive med", slot: "morning", active: false });

  const morning = repo.listForSlot("morning").map((m) => m.name);
  assert.deepEqual(morning.sort(), ["Both med", "Morning med"]);
});

test("update overwrites fields", () => {
  const repo = newRepo();
  const created = repo.create(sample);
  const updated = repo.update(created.id, { ...sample, dosage: "1000mg" });
  assert.equal(updated?.dosage, "1000mg");
  assert.equal(repo.listAll()[0].dosage, "1000mg");
});

test("remove deletes the medication", () => {
  const repo = newRepo();
  const created = repo.create(sample);
  repo.remove(created.id);
  assert.deepEqual(repo.listAll(), []);
});

test("update returns undefined for an unknown id", () => {
  const repo = newRepo();
  assert.equal(repo.update(999, sample), undefined);
});
