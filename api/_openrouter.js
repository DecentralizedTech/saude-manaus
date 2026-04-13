// api/_openrouter.js
// Usa openrouter/free — seleciona automaticamente qualquer modelo gratuito disponível

export async function chatCompletion(messages, maxTokens = 600) {
  const models = [
    'google/gemma-3-27b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
  ]

  let lastError = ''
  for (const model of models) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://saude-manaus.vercel.app',
        'X-Title':       'Saúde Manaus',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
    })
    const text = await res.text()
    if (res.ok) {
      const data = JSON.parse(text)
      return data.choices?.[0]?.message?.content?.trim() || ''
    }
    // Se for rate limit ou indisponível, tenta próximo
    const err = JSON.parse(text)
    lastError = text
    const code = err?.error?.code
    if (code === 402 || code === 429 || code === 503) continue
    throw new Error(text)
  }
  throw new Error('Todos os modelos indisponíveis: ' + lastError)
}
