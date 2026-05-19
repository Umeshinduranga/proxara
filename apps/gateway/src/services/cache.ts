import { openai } from '../lib/openai'
import { index } from '../lib/pinecone'

const SIMILARITY_THRESHOLD = 0.98
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

export async function checkCache(
  prompt: string,
  tenantId: string
): Promise<{ hit: boolean; response?: string; vector?: number[] }> {
  try {
    if (!index) {
      return { hit: false }
    }

    const vector = await getEmbedding(prompt)

    const results = await index.query({
      vector,
      topK: 1,
      filter: {
        tenantId: { $eq: tenantId },
        cachedAt: { $gt: Date.now() - CACHE_TTL_MS }
      },
      includeMetadata: true,
    })

    const topMatch = results.matches[0]

    if (topMatch && topMatch.score && topMatch.score >= SIMILARITY_THRESHOLD) {
      console.log(`💾 Cache HIT - similarity: ${topMatch.score.toFixed(4)}`)
      return {
        hit: true,
        response: topMatch.metadata?.response as string,
        vector
      }
    }

    console.log(`🔍 Cache MISS - similarity: ${topMatch?.score?.toFixed(4) || 'none'}`)
    return { hit: false, vector }
  } catch (error: any) {
    console.error('⚠️  Cache check failed:', error.message)
    return { hit: false }
  }
}

export async function saveToCache(
  prompt: string,
  response: string,
  tenantId: string,
  vector: number[]
): Promise<void> {
  try {
    if (!index) {
      return
    }

    const id = `${tenantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    await index.upsert([{
      id,
      values: vector,
      metadata: {
        tenantId,
        prompt,
        response,
        cachedAt: Date.now(),
      }
    }])

    console.log(`💾 Saved to cache - id: ${id}`)
  } catch (error: any) {
    console.error('⚠️  Cache save failed:', error.message)
  }
}