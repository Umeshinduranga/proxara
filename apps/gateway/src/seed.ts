import 'dotenv/config'
import { redis } from './lib/redis'
import { generateApiKey, generateTenantId } from './services/keyGenerator'

async function seed() {
  const apiKey = generateApiKey()
  const tenantId = generateTenantId()

  // hSet stores multiple fields under one key.
  await redis.hset(`gateway_key:${apiKey}`, {
    tenantId,
    name: 'Test Tenant',
    openaiKey: process.env.OPENAI_API_KEY || '',
    createdAt: new Date().toISOString(),
    active: 'true'
  })

  console.log('Test API key created successfully')
  console.log('-------------------------------------')
  console.log(`API Key:   ${apiKey}`)
  console.log(`Tenant ID: ${tenantId}`)
  console.log('-------------------------------------')
  console.log('Copy this API key; you will need it for testing')

  await redis.disconnect()
  process.exit(0)
}

seed().catch(async (error) => {
  console.error(error)
  await redis.disconnect()
  process.exit(1)
})
