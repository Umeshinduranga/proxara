import { FastifyInstance } from 'fastify'
import { openai } from '../lib/openai'
import { authMiddleware } from '../middleware/auth'

export async function proxyRoutes(app: FastifyInstance) {

  app.post('/v1/chat/completions', {
    preHandler: authMiddleware
  }, async (request, reply) => {

    const body = request.body as any

    if (!body?.messages || !Array.isArray(body.messages)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'messages array is required'
      })
    }

    const startTime = Date.now()

        try {
      console.log(`Forwarding tenant ${request.tenantId} request to OpenAI...`)

      const response = await openai.chat.completions.create({
        model: body.model || 'gpt-4o-mini',
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 1000,
      })

      const latency = Date.now() - startTime
      const tokensUsed = response.usage?.total_tokens || 0

      console.log(`✅ OpenAI responded in ${latency}ms — ${tokensUsed} tokens used`)

      return reply.send(response)

    } catch (error: any) {
      const latency = Date.now() - startTime
      console.error(`❌ OpenAI error after ${latency}ms:`, error.message)

      if (error.status === 401) {
        return reply.status(401).send({
          error: 'Invalid OpenAI API key'
        })
      }

      if (error.status === 429) {
        return reply.status(429).send({
<<<<<<< HEAD
          error: 'OpenAI rate limit reached'
=======
          error: 'OpenAI rate limit reached',
          message: 'Too many requests, please slow down'
        })
      }

      if (error.status === 429) {
        return reply.status(429).send({
          error: 'OpenAI rate limit reached',
          message: 'Too many requests, please slow down'
        })
      }

      if (error.status === 500) {
        return reply.status(502).send({
          error: 'OpenAI is currently unavailable',
          message: 'Try again in a few seconds'
        })
      }

      return reply.status(500).send({
        error: 'Gateway error',
        message: error.message
      })
    }
  })

}
      })
