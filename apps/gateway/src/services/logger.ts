import { pool } from '../lib/db'
import { createHash } from 'crypto'

interface LogEntry {
  tenantId: string
  prompt: string
  tokensUsed: number
  cacheHit: boolean
  provider: string
  latencyMs: number
}

export async function logRequest(entry: LogEntry): Promise<void> {
  try {
    // Hash the prompt for privacy
    // Never store raw prompts in the database
    const promptHash = createHash('sha256')
      .update(entry.prompt)
      .digest('hex')

    await pool.query(`
      INSERT INTO requests
        (tenant_id, prompt_hash, tokens_used, cache_hit, provider, latency_ms)
      VALUES
        ($1, $2, $3, $4, $5, $6)
    `, [
      entry.tenantId,
      promptHash,
      entry.tokensUsed,
      entry.cacheHit,
      entry.provider,
      entry.latencyMs
    ])

  } catch (error: any) {
    // Never let logging crash the request
    console.error('⚠️ Log failed:', error.message)
  }
}
