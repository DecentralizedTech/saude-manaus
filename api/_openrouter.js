// api/_openrouter.js
// Usa openrouter/free — seleciona automaticamente qualquer modelo gratuito disponível

export async function chatCompletion(messages, maxTokens = 600) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://saude-manaus.vercel.app',
      'X-Title':       'Saúde Manaus',
    },
    body: JSON.stringify({
      model:      'openrouter/auto',
      max_tokens: maxTokens,
      messages,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${text}`)
  const data = JSON.parse(text)
  return data.choices?.[0]?.message?.content?.trim() || ''
}
