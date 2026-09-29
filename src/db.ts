import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export function openDatabase(path: string): Database.Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      quantity TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      slot TEXT NOT NULL CHECK (slot IN ('morning','evening','both')),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS call_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot TEXT NOT NULL,
      called_at TEXT NOT NULL,
      status TEXT NOT NULL,
      twilio_call_sid TEXT,
      error TEXT
    );
  `);
  return db;
}
