import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'

// Create the Fastify server instance
const app = Fastify({
  logger: true  // This prints every request to your terminal
})

// Register CORS so the dashboard can talk to the gateway later
app.register(cors, {
  origin: true
})

// ── ROUTE 1: Health Check ────────────────────────────────
// This tells us the server is alive
app.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    version: '0.1.0',
    name: 'Proxara Gateway'
  }
})

// ── ROUTE 2: Proxy Placeholder ───────────────────────────
// This is the route your AI agents will eventually call
// For now it just confirms the route exists
app.post('/v1/chat/completions', async (request, reply) => {
  return {
    message: 'Proxara is alive. Proxy logic coming soon.',
    receivedBody: request.body
  }
})

// ── START THE SERVER ─────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001

app.listen({ port: PORT }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log(`
  ██████╗ ██████╗  ██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ 
  ██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝██╔══██╗██╔══██╗██╔══██╗
  ██████╔╝██████╔╝██║   ██║ ╚███╔╝ ███████║██████╔╝███████║
  ██╔═══╝ ██╔══██╗██║   ██║ ██╔██╗ ██╔══██║██╔══██╗██╔══██║
  ██║     ██║  ██║╚██████╔╝██╔╝ ██╗██║  ██║██║  ██║██║  ██║
  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  
  Gateway running on http://localhost:${PORT}
  `)
})
