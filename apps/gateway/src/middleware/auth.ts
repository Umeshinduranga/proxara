import { FastifyRequest, FastifyReply } from 'fastify'
import { redis } from '../lib/redis'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
    keyId: string
    tenantOpenAIKey: string
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Use: Bearer prx_live_...'
    })
  }

  const apiKey = authHeader.split(' ')[1]

  if (!apiKey || !apiKey.startsWith('prx_live_')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key format'
    })
  }

  const keyData = await redis.hgetall(`gateway_key:${apiKey}`)

  if (!keyData || !keyData.tenantId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key not found'
    })
  }

  if (keyData.active !== 'true') {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key is disabled'
    })
  }

  request.tenantId = keyData.tenantId
  request.keyId = apiKey
  request.tenantOpenAIKey = keyData.openaiKey

  console.log(`Auth passed - Tenant: ${keyData.name} (${keyData.tenantId})`)
}
