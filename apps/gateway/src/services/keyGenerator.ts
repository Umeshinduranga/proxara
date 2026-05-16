import { randomBytes } from 'crypto'

// Generates a unique Proxara API key.
// Format: prx_live_xxxxxxxxxxxxxxxxxxxx
export function generateApiKey(): string {
  const random = randomBytes(24).toString('hex')
  return `prx_live_${random}`
}

// Generates a tenant ID.
export function generateTenantId(): string {
  return randomBytes(16).toString('hex')
}
