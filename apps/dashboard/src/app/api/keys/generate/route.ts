import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from 'redis'

async function getRedis() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

  await client.connect()
  return client
}

function generateApiKey(): string {
  return `prx_live_${randomBytes(24).toString('hex')}`
}

function generateTenantId(): string {
  return randomBytes(16).toString('hex')
}

// POST /api/keys/generate
export async function POST(request: Request) {
  const redis = await getRedis()

  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'New Tenant'
    const now = new Date().toISOString()
    const apiKey = generateApiKey()
    const tenantId = generateTenantId()

    await redis.hSet(`gateway_key:${apiKey}`, {
      tenantId,
      name,
      createdAt: now,
      active: 'true',
    })

    return NextResponse.json({
      success: true,
      apiKey,
      tenantId,
      name,
      createdAt: now,
    })
  } finally {
    await redis.disconnect()
  }
}