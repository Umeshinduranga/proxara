import { pool } from './db'

export async function createTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    TEXT NOT NULL,
      prompt_hash  TEXT,
      tokens_used  INTEGER DEFAULT 0,
      cache_hit    BOOLEAN DEFAULT false,
      provider     TEXT,
      latency_ms   INTEGER,
      created_at   TIMESTAMPTZ DEFAULT now()
    )
  `)
  console.log('✅ Database tables ready')
}
