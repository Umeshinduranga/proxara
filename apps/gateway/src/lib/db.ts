import { Pool } from 'pg'

// Connection pool - reuses connections instead of creating new ones
// for every request (much faster)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://proxara:proxara_dev@localhost:5432/proxara',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message)
})

export { pool }