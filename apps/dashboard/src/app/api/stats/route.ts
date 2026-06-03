import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://proxara:proxara_dev@localhost:5432/proxara'
})

export async function GET() {
  try {
    // Get overall stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*)::int                                          AS total_requests,
        SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::int       AS cache_hits,
        SUM(tokens_used)::int                                  AS total_tokens,
        ROUND(AVG(latency_ms))::int                           AS avg_latency_ms,
        SUM(CASE WHEN cache_hit THEN tokens_used ELSE 0 END)::int AS tokens_saved
      FROM requests
    `)

    // Get requests per hour for chart
    const chartResult = await pool.query(`
      SELECT
        DATE_TRUNC('hour', created_at) AS hour,
        COUNT(*)::int                  AS requests,
        SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END)::int AS cache_hits
      FROM requests
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour ASC
    `)

    // Get provider breakdown
    const providerResult = await pool.query(`
      SELECT
        provider,
        COUNT(*)::int AS count
      FROM requests
      GROUP BY provider
    `)

    return NextResponse.json({
      stats: statsResult.rows[0],
      chart: chartResult.rows,
      providers: providerResult.rows
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard stats'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
