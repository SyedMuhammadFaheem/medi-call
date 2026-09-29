import type Database from "better-sqlite3";
import type { Medication, NewMedication, ReminderSlot } from "../types.ts";

export interface MedicationRepository {
  listForSlot(slot: ReminderSlot): Medication[];
  listAll(): Medication[];
  create(med: NewMedication): Medication;
  update(id: number, med: NewMedication): Medication | undefined;
  remove(id: number): void;
}

interface MedicationRow {
  id: number;
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
  slot: Medication["slot"];
  active: number;
}

function rowToMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    quantity: row.quantity,
    instructions: row.instructions,
    slot: row.slot,
    active: row.active === 1,
  };
}

export function createSqliteMedicationRepository(db: Database.Database): MedicationRepository {
  return {
    listForSlot(slot) {
      const rows = db
        .prepare<[ReminderSlot], MedicationRow>(
          `SELECT * FROM medications WHERE active = 1 AND (slot = ? OR slot = 'both') ORDER BY id`,
        )
        .all(slot);
      return rows.map(rowToMedication);
    },

    listAll() {
      const rows = db.prepare<[], MedicationRow>(`SELECT * FROM medications ORDER BY id`).all();
      return rows.map(rowToMedication);
    },

    create(med) {
      const info = db
        .prepare(
          `INSERT INTO medications (name, dosage, quantity, instructions, slot, active)
           VALUES (@name, @dosage, @quantity, @instructions, @slot, @active)`,
        )
        .run({ ...med, active: med.active ? 1 : 0 });
      return { id: Number(info.lastInsertRowid), ...med };
    },

    update(id, med) {
      const info = db.prepare(
        `UPDATE medications
         SET name = @name, dosage = @dosage, quantity = @quantity,
             instructions = @instructions, slot = @slot, active = @active
         WHERE id = @id`,
      ).run({ ...med, active: med.active ? 1 : 0, id });
      return info.changes === 0 ? undefined : { id, ...med };
    },

    remove(id) {
      db.prepare(`DELETE FROM medications WHERE id = ?`).run(id);
    },
  };
}
