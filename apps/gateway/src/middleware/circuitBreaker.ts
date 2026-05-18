import { FastifyRequest, FastifyReply } from 'fastify'
import { CircuitBreaker } from '../services/circuitBreaker'

declare module 'fastify' {
  interface FastifyRequest {
    circuitBreaker: CircuitBreaker
  }
}

export async function circuitBreakerMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const breaker = new CircuitBreaker(request.tenantId)
  const state = await breaker.getState()

  console.log(`⚡ Circuit state for tenant ${request.tenantId}: ${state}`)

  if (state === 'OPEN') {
    return reply.status(503).send({
      error: 'Circuit Breaker Open',
      message: 'Too many failures detected. Requests blocked for 5 minutes.',
      retryAfter: 300
    })
  }

  if (state === 'HALF_OPEN') {
    const gotLock = await breaker.acquireHalfOpenLock()

    if (!gotLock) {
      return reply.status(503).send({
        error: 'Circuit Breaker Half-Open',
        message: 'System is recovering. Please retry in 5 seconds.',
        retryAfter: 5
      })
    }

    console.log(`🟡 Half-open - letting one request through to test recovery`)
  }

  request.circuitBreaker = breaker
}