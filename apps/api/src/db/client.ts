import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let _db: Database.Database | null = null;

export function getDb(dbPath: string): Database.Database {
  if (_db) return _db;

  mkdirSync(dirname(dbPath), { recursive: true });

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
