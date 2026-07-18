import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";

export function registerProjectRuleRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/rules", async (req) => {
    const { ownerType, ownerId } = req.query as { ownerType?: string; ownerId?: string };
    if (ownerType && ownerId) {
      const rules = db.prepare(
        "SELECT * FROM project_rules WHERE owner_type = ? AND owner_id = ? AND is_active = 1 ORDER BY rule_key"
      ).all(ownerType, Number(ownerId));
      return { rules };
    }
    const rules = db.prepare("SELECT * FROM project_rules WHERE is_active = 1 ORDER BY owner_type, owner_id, rule_key").all();
    return { rules };
  });

  app.post("/rules", async (req) => {
    const { ownerType, ownerId, ruleKey, title, content, precedenceMode } = req.body as {
      ownerType: string; ownerId: number; ruleKey: string; title: string; content: string; precedenceMode?: string;
    };
    const result = db.prepare(
      "INSERT INTO project_rules (owner_type, owner_id, rule_key, title, content, precedence_mode, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
    ).run(ownerType, ownerId, ruleKey, title, content, precedenceMode || "extend", nowISO());
    return { id: result.lastInsertRowid };
  });

  app.put("/rules/:id", async (req) => {
    const { id } = req.params as { id: string };
    const { title, content, precedenceMode, isActive } = req.body as {
      title?: string; content?: string; precedenceMode?: string; isActive?: boolean;
    };
    const updates: string[] = [];
    const values: any[] = [];
    if (title !== undefined) { updates.push("title = ?"); values.push(title); }
    if (content !== undefined) { updates.push("content = ?"); values.push(content); }
    if (precedenceMode !== undefined) { updates.push("precedence_mode = ?"); values.push(precedenceMode); }
    if (isActive !== undefined) { updates.push("is_active = ?"); values.push(isActive ? 1 : 0); }
    if (updates.length === 0) return { ok: true };
    updates.push("updated_at = ?");
    values.push(nowISO());
    values.push(Number(id));
    db.prepare(`UPDATE project_rules SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    return { ok: true };
  });

  app.delete("/rules/:id", async (req) => {
    const { id } = req.params as { id: string };
    db.prepare("UPDATE project_rules SET is_active = 0, updated_at = ? WHERE id = ?").run(nowISO(), Number(id));
    return { ok: true };
  });
}
