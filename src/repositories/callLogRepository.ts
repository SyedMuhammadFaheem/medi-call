import type Database from "better-sqlite3";
import type { CallLogEntry, CallStatus, ReminderSlot } from "../types.ts";

export interface CallLogRepository {
  record(entry: {
    slot: ReminderSlot;
    status: CallStatus;
    twilioCallSid: string | null;
    error: string | null;
  }): void;
  recent(limit: number): CallLogEntry[];
}

interface CallLogRow {
  id: number;
  slot: ReminderSlot;
  called_at: string;
  status: CallStatus;
  twilio_call_sid: string | null;
  error: string | null;
}

function rowToEntry(row: CallLogRow): CallLogEntry {
  return {
    id: row.id,
    slot: row.slot,
    calledAt: row.called_at,
    status: row.status,
    twilioCallSid: row.twilio_call_sid,
    error: row.error,
  };
}

export function createSqliteCallLogRepository(db: Database.Database): CallLogRepository {
  return {
    record(entry) {
      db.prepare(
        `INSERT INTO call_log (slot, called_at, status, twilio_call_sid, error)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(entry.slot, new Date().toISOString(), entry.status, entry.twilioCallSid, entry.error);
    },

    recent(limit) {
      const rows = db
        .prepare<[number], CallLogRow>(`SELECT * FROM call_log ORDER BY id DESC LIMIT ?`)
        .all(limit);
      return rows.map(rowToEntry);
    },
  };
}
