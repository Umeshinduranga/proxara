import { redis } from '../lib/redis'

const FAILURE_THRESHOLD = 5
const FAILURE_WINDOW = 60
const TIMEOUT_DURATION = 300
const SUCCESS_THRESHOLD = 2

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export class CircuitBreaker {
  private prefix: string

  constructor(tenantId: string) {
    this.prefix = `circuit:${tenantId}`
  }

  async getState(): Promise<CircuitState> {
    const state = await redis.get(`${this.prefix}:state`)
    return (state as CircuitState) || 'CLOSED'
  }

  async recordFailure(): Promise<void> {
    const failureKey = `${this.prefix}:failures`
    const failures = await redis.incr(failureKey)

    if (failures === 1) {
      await redis.expire(failureKey, FAILURE_WINDOW)
    }

    console.log(`⚠️  Failure recorded - count: ${failures}/${FAILURE_THRESHOLD}`)

    if (failures >= FAILURE_THRESHOLD) {
      await redis.set(`${this.prefix}:state`, 'OPEN')
      await redis.expire(`${this.prefix}:state`, TIMEOUT_DURATION)

      console.log(`🔴 Circuit TRIPPED for tenant: ${this.prefix}`)
      console.log(`   Blocked for ${TIMEOUT_DURATION / 60} minutes`)
    }
  }

  async recordSuccess(): Promise<void> {
    const state = await this.getState()

    if (state === 'HALF_OPEN') {
      const successKey = `${this.prefix}:half_open_successes`
      const successes = await redis.incr(successKey)

      console.log(`🟡 Half-open success: ${successes}/${SUCCESS_THRESHOLD}`)

      if (successes >= SUCCESS_THRESHOLD) {
        await redis.del(`${this.prefix}:state`)
        await redis.del(`${this.prefix}:failures`)
        await redis.del(successKey)
        await redis.del(`${this.prefix}:half_open_lock`)

        console.log(`🟢 Circuit CLOSED - tenant recovered`)
      }
    } else if (state === 'CLOSED') {
      await redis.del(`${this.prefix}:failures`)
    }
  }

  async acquireHalfOpenLock(): Promise<boolean> {
    const lockKey = `${this.prefix}:half_open_lock`
    const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX')
    return acquired === 'OK'
  }
}