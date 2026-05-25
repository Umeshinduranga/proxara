import OpenAI from 'openai'

export interface RouteResult {
  content: string
  provider: 'openai' | 'groq'
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ── ONLY FAILOVER ON SERVER ERRORS ────────────────────────
// Never failover on 400, 401, 429 — those are client errors
function shouldFailover(error: any): boolean {
  const status = error.status || error.statusCode || 0
  return (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 0    // network error
  )
}

// ── CALL OPENAI ────────────────────────────────────────────
async function callOpenAI(body: any): Promise<RouteResult> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await client.chat.completions.create({
    model: body.model || 'gpt-4o-mini',
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 1000,
  })

  return {
    content: response.choices[0].message.content || '',
    provider: 'openai',
    model: response.model,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    }
  }
}

// ── CALL GROQ (FREE FALLBACK) ──────────────────────────────
// Groq uses exact same OpenAI SDK format
// Zero code changes needed
async function callGroq(body: any): Promise<RouteResult> {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  })

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 1000,
  })

  return {
    content: response.choices[0].message.content || '',
    provider: 'groq',
    model: response.model,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    }
  }
}

// ── MAIN ROUTER ────────────────────────────────────────────
export async function routeToLLM(body: any): Promise<RouteResult> {

  // ── TRY GROQ FIRST (FREE) ──────────────────────────────
  try {
    console.log(`🔀 Trying Groq...`)
    const result = await callGroq(body)
    console.log(`✅ Groq succeeded`)
    return result

  } catch (error: any) {
    console.error(`❌ Groq failed: ${error.message}`)

    if (!shouldFailover(error)) {
      throw error
    }

    console.log(`🔀 Failing over to OpenAI...`)
  }

  // ── TRY OPENAI SECOND ─────────────────────────────────
  try {
    const result = await callOpenAI(body)
    console.log(`✅ OpenAI succeeded`)
    return result

  } catch (error: any) {
    console.error(`❌ OpenAI failed: ${error.message}`)
    throw new Error('All providers failed. Please try again later.')
  }
}
