import { Pinecone } from '@pinecone-database/pinecone'

const apiKey = process.env.PINECONE_API_KEY

const pinecone = apiKey
  ? new Pinecone({ apiKey })
  : null

const index = pinecone
  ? pinecone.index(process.env.PINECONE_INDEX || 'proxara-cache')
  : null

if (pinecone && index) {
  console.log('✅ Pinecone connected')
} else {
  console.warn('⚠️  Pinecone not configured - semantic cache disabled')
}

export { pinecone, index }