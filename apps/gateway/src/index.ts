import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'
import { redis } from './lib/redis'
import { pool } from './lib/db'
import './lib/pinecone'
import { proxyRoutes } from './routes/proxy'
import { createTables } from './lib/schema'

// Create the Fastify server instance
const app = Fastify({
  logger: true
})

// Register CORS so the dashboard can talk to the gateway later
app.register(cors, {
  origin: true
})

// ── REGISTER ROUTES ───────────────────────────────────────
app.register(proxyRoutes)

// ── HEALTH CHECK ─────────────────────────────────────────
// Now checks Redis AND PostgreSQL are alive
app.get('/health', async () => {
  let redisStatus = 'ok'

  try {
    await redis.ping()
  } catch {
    redisStatus = 'error'
  }

  let postgresStatus = 'ok'

  try {
    await pool.query('SELECT 1')
  } catch {
    postgresStatus = 'error'
  }

  return {
    status: redisStatus === 'ok' && postgresStatus === 'ok' ? 'ok' : 'degraded',
    version: '0.1.0',
    name: 'Proxara Gateway',
    services: {
      redis: redisStatus,
      postgres: postgresStatus
    }
  }
})

// ── PROXY PLACEHOLDER ────────────────────────────────────
// proxy route is registered from ./routes/proxy

// ── START ────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001

app.listen({ port: PORT, host: '0.0.0.0' }, async (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }

  // Create database tables if they don't exist
  await createTables()

  console.log(`
  ██████╗ ██████╗  ██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ 
  ██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝██╔══██╗██╔══██╗██╔══██╗
  ██████╔╝██████╔╝██║   ██║ ╚███╔╝ ███████║██████╔╝███████║
  ██╔═══╝ ██╔══██╗██║   ██║ ██╔██╗ ██╔══██║██╔══██╗██╔══██║
  ██║     ██║  ██║╚██████╔╝██╔╝ ██╗██║  ██║██║  ██║██║  ██║
  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  
  Gateway running on http://0.0.0.0:${PORT}
  `)
})
