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
    }
  }
}

export { openai }
