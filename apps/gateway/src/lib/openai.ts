import OpenAI from 'openai'

const key = process.env.OPENAI_API_KEY

let openai: any

if (key && !key.startsWith('sk-your-real')) {
  openai = new OpenAI({ apiKey: key })
} else {
  // Mock client used when no valid OPENAI_API_KEY is provided.
  // This lets local development exercise the proxy route without a real key.
  openai = {
    chat: {
      completions: {
        create: async (opts: any) => {
          // Simulate network latency
          await new Promise((r) => setTimeout(r, 200))
          return {
            id: 'chatcmpl-mock',
            object: 'chat.completion',
            model: opts.model || 'gpt-4o-mini',
            choices: [
              {
                message: { role: 'assistant', content: 'Hello from Proxara — your intelligent AI gateway!' },
                finish_reason: 'stop'
              }
            ],
            usage: {
              prompt_tokens: 15,
              completion_tokens: 12,
              total_tokens: 27
            }
          }
        }
      }
    },
    embeddings: {
      create: async (opts: any) => {
        // Mock embeddings - deterministic based on input text for testing
        // Convert text to a simple hash-based embedding
        const text = typeof opts.input === 'string' ? opts.input : opts.input[0]
        const hash = text.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
        const embedding = Array(1536).fill(0).map((_: any, i: number) => {
          return Math.sin(hash * (i + 1) / 100) * 0.5 + 0.5
        })
        
        return {
          object: 'list',
          data: [{ embedding, index: 0 }],
          model: 'text-embedding-3-small',
          usage: { prompt_tokens: 5, total_tokens: 5 }
        }
      }
    }
  }
}

export { openai }
