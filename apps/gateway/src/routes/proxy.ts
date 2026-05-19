import { FastifyInstance } from 'fastify'
import { openai } from '../lib/openai'
import { authMiddleware } from '../middleware/auth'
import { circuitBreakerMiddleware } from '../middleware/circuitBreaker'
import { checkCache, saveToCache } from '../services/cache'

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

    try {
      console.log(`📤 Tenant ${request.tenantId} forwarding to OpenAI...`)

      const response = await openai.chat.completions.create({
        model: body.model || 'gpt-4o-mini',
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 1000,
      })

      const latency = Date.now() - startTime
      const tokensUsed = response.usage?.total_tokens || 0
      const assistantMessage = response.choices[0].message.content || ''

      if (vector) {
        saveToCache(userPrompt, assistantMessage, request.tenantId, vector)
          .catch((error) => console.error(error))
      }

      await request.circuitBreaker.recordSuccess()

      console.log(`✅ Success - ${latency}ms - ${tokensUsed} tokens`)

      return reply.send({
        ...response,
        proxara: {
          cached: false,
          latencyMs: latency
        }
      })

    } catch (error: any) {
      const latency = Date.now() - startTime
      await request.circuitBreaker.recordFailure()

      console.error(`❌ Failed after ${latency}ms - ${error.message}`)

      if (error.status === 401) {
        return reply.status(401).send({ error: 'Invalid OpenAI API key' })
      }

      if (error.status === 429) {
        return reply.status(429).send({
          error: 'OpenAI rate limit reached'
        })
      }

      return reply.status(500).send({
        error: 'Gateway error',
        message: error.message
      })
    }
  })

}

