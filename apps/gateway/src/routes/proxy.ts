import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { circuitBreakerMiddleware } from '../middleware/circuitBreaker'
import { checkCache, saveToCache } from '../services/cache'
import { routeToLLM } from '../services/router'

export async function proxyRoutes(app: FastifyInstance) {

  app.post('/v1/chat/completions', {
    preHandler: [authMiddleware, circuitBreakerMiddleware]
  }, async (request, reply) => {

    const body = request.body as any

    if (!body?.messages || !Array.isArray(body.messages)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'messages array is required'
      })
    }

    const startTime = Date.now()

    const userPrompt = body.messages
      .filter((message: any) => message.role === 'user')
      .map((message: any) => message.content)
      .join(' ')

    const { hit, response: cachedResponse, vector } = await checkCache(
      userPrompt,
      request.tenantId
    )

    if (hit && cachedResponse) {
      const latency = Date.now() - startTime

      console.log(`⚡ Returning cached response in ${latency}ms`)

      return reply.send({
        id: `cache-${Date.now()}`,
        object: 'chat.completion',
        model: body.model || 'gpt-4o-mini',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: cachedResponse
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        proxara: {
          cached: true,
          latencyMs: latency
        }
      })
    }

    // ── STEP 2: ROUTE TO LLM WITH FAILOVER ──────────────
    try {
      const result = await routeToLLM(body)
      const latency = Date.now() - startTime

      // Save to cache for next time — fire and forget
      if (vector) {
        saveToCache(userPrompt, result.content, request.tenantId, vector)
          .catch(console.error)
      }

      await request.circuitBreaker.recordSuccess()

      console.log(`✅ ${result.provider} responded in ${latency}ms — ${result.usage.totalTokens} tokens`)

      return reply.send({
        id: `proxara-${Date.now()}`,
        object: 'chat.completion',
        model: result.model,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: result.content },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: result.usage.promptTokens,
          completion_tokens: result.usage.completionTokens,
          total_tokens: result.usage.totalTokens
        },
        proxara: {
          cached: false,
          provider: result.provider,
          latencyMs: latency
        }
      })

    } catch (error: any) {
      await request.circuitBreaker.recordFailure()
      console.error(`❌ All providers failed:`, error.message)

      return reply.status(502).send({
        error: 'All providers failed',
        message: error.message
      })
    }
  })

}

