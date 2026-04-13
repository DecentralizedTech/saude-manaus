// api/_llm.js
// Cliente para OpenRouter — Gemma 4 26B (gratuito)

const MODEL = 'google/gemma-4-26b-a4b-it:free'
const BASE   = 'https://openrouter.ai/api/v1/chat/completions'

export async function chatCompletion(messages, { maxTokens = 512 } = {}) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer':  'https://saude-manaus.vercel.app',
      'X-Title':       'Saúde Manaus',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: maxTokens,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
