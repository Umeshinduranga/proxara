import { NextResponse } from 'next/server'
import { createClient } from 'redis'

async function getRedis() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

  await client.connect()
  return client
}

// DELETE /api/keys/revoke
export async function DELETE(request: Request) {
  const redis = await getRedis()

  try {
    const body = await request.json().catch(() => ({}))
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''

    if (!apiKey) {
      return NextResponse.json({ error: 'apiKey is required' }, { status: 400 })
    }

    await redis.hSet(`gateway_key:${apiKey}`, {
      active: 'false',
      revokedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } finally {
    await redis.disconnect()
  }
}