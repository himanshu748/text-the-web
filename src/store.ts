import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Event } from './types.js';
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export class Store {
  db: DatabaseSync;
  constructor(path = '.data/state.sqlite') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL, code TEXT, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS contexts (id TEXT PRIMARY KEY, url TEXT NOT NULL, remaining INTEGER NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS limits (id TEXT PRIMARY KEY, last INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS budgets (day TEXT PRIMARY KEY, used INTEGER NOT NULL);
      UPDATE receipts SET state='interrupted', code='process_restarted' WHERE state IN ('researching','send_intent');`);
  }
  key(e: Event) { return hash(JSON.stringify([e.platform, e.conversation, e.sender])); }
  receipt(e: Event) { return hash(JSON.stringify([e.platform, e.conversation, e.id])); }
  claim(e: Event): 'new' | 'duplicate' | 'conflict' {
    const id = this.receipt(e), payload = hash(JSON.stringify(e));
    const existing = this.db.prepare('SELECT payload FROM receipts WHERE id=?').get(id);
    if (existing) return existing.payload === payload ? 'duplicate' : 'conflict';
    this.db.prepare('INSERT INTO receipts VALUES (?,?,?,NULL,?)').run(id, payload, 'accepted', Date.now());
    return 'new';
  }
  state(e: Event, state: string, code = '') { this.db.prepare('UPDATE receipts SET state=?,code=? WHERE id=?').run(state, code, this.receipt(e)); }
  reserve(e: Event, now: number, max: number): 'ok' | 'rate_limit' | 'budget' {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const key = this.key(e), day = new Date(now).toISOString().slice(0, 10);
      const last = this.db.prepare('SELECT last FROM limits WHERE id=?').get(key)?.last;
      const used = Number(this.db.prepare('SELECT used FROM budgets WHERE day=?').get(day)?.used ?? 0);
      let result: 'ok' | 'rate_limit' | 'budget' = 'ok';
      if (last !== undefined && now - Number(last) < 60000) result = 'rate_limit';
      else if (used >= max || Number(this.db.prepare('SELECT coalesce(sum(used),0) AS total FROM budgets').get()?.total) >= max) result = 'budget';
      else {
        this.db.prepare('INSERT INTO limits VALUES (?,?) ON CONFLICT(id) DO UPDATE SET last=excluded.last').run(key, now);
        this.db.prepare('INSERT INTO budgets VALUES (?,1) ON CONFLICT(day) DO UPDATE SET used=used+1').run(day);
      }
      this.db.exec('COMMIT'); return result;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  context(e: Event, now: number) {
    const row = this.db.prepare('SELECT * FROM contexts WHERE id=? AND expires>?').get(this.key(e), now);
    return row ? { url: String(row.url), remaining: Number(row.remaining) } : undefined;
  }
  remember(e: Event, url: string, now: number) { this.db.prepare('INSERT INTO contexts VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET url=excluded.url,remaining=1,expires=excluded.expires').run(this.key(e), url, now + 900000); }
  follow(e: Event) { this.db.prepare('UPDATE contexts SET remaining=0 WHERE id=?').run(this.key(e)); }
  used(){return Number(this.db.prepare('SELECT coalesce(sum(used),0) AS total FROM budgets').get()?.total);}
  stats() { return this.db.prepare('SELECT state,code,count(*) AS count FROM receipts GROUP BY state,code').all(); }
  close() { this.db.close(); }
}
