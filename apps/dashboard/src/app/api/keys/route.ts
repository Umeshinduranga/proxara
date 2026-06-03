import { NextResponse } from 'next/server'
import { createClient } from 'redis'

async function getRedis() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

  await client.connect()
  return client
}

// GET /api/keys - fetch all keys
export async function GET() {
  const redis = await getRedis()

  try {
    const keyPattern = 'gateway_key:prx_live_*'
    const keys = await redis.keys(keyPattern)

    if (keys.length === 0) {
      return NextResponse.json({ keys: [] })
    }

    const keyDetails = await Promise.all(
      keys.map(async (redisKey) => {
        const data = await redis.hGetAll(redisKey)
        const apiKey = redisKey.replace('gateway_key:', '')

        return {
          apiKey,
          maskedKey: `${apiKey.slice(0, 20)}...`,
          name: data.name || 'Unknown',
          tenantId: data.tenantId || '',
          createdAt: data.createdAt || '',
          revokedAt: data.revokedAt || '',
          active: data.active !== 'false',
        }
      })
    )

    keyDetails.sort((left, right) => {
      if (left.active !== right.active) {
        return left.active ? -1 : 1
      }

      return (right.createdAt || '').localeCompare(left.createdAt || '')
    })

    return NextResponse.json({ keys: keyDetails })
  } finally {
    await redis.disconnect()
  }
}