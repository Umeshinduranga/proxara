import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://proxara:proxara_dev@localhost:5432/proxara',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message)
})

// Test connection immediately on startup
pool.query('SELECT 1')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err) => console.error('❌ PostgreSQL failed:', err.message))

export { pool }