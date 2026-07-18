import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export function migrate(db: Database.Database, migrationsDir: string): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare("SELECT version FROM _migrations ORDER BY version").all()
      .map((r: any) => r.version)
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) continue;
    const version = Number.parseInt(match[1], 10);
    if (applied.has(version)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (version) VALUES (?)").run(version);
    console.log(`Migration ${file} applied`);
  }
}
