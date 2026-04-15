// api/assistente.js
import { getUnidades, getAvaliacoesUnidade } from './_kv.js'
import { chatCompletion } from './_openrouter.js'
import { calcularScoreGeral } from './_score.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { mensagem, historico = [] } = req.body
  if (!mensagem) return res.status(400).json({ error: 'mensagem obrigatória' })

  const unidades = await getUnidades()
  const ativas = unidades.filter(u => u.ativo !== false && u.ativo !== 'false')

  // Carrega avaliações em paralelo (mais rápido que sequencial)
  const avaliacoesPorUnidade = await Promise.all(
    ativas.map(u => getAvaliacoesUnidade(u.id))
  )

  const linhas = ativas.map((u, i) => {
    const avs = avaliacoesPorUnidade[i]
    let scoreText = 'sem dados'
    if (avs.length >= 1) {
      const porTipo = {}
      for (const av of avs) {
        if (!porTipo[av.tipoAtendimento]) porTipo[av.tipoAtendimento] = []
        porTipo[av.tipoAtendimento].push(Number(av.score))
      }
      const mediaPorTipo = {}
      for (const [tipo, scores] of Object.entries(porTipo))
        mediaPorTipo[tipo] = scores.reduce((a, b) => a + b, 0) / scores.length
      scoreText = calcularScoreGeral(mediaPorTipo).toFixed(1)
    }
    const rede = u.particular === 'true' ? 'Particular' : 'Público'
    return `${u.nome}|${u.tipo}|${rede}|${u.bairro},Zona ${u.zona}|Tel:${u.telefone || 'S/N'}|Score:${scoreText}`
  })

  const resumo = linhas.join('\n')

  const systemPrompt = `Você é o assistente virtual do Saúde Manaus. RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO. Seja direto, claro e empático. Não invente dados.

Quando perguntarem sobre scores ou rankings, use os valores da coluna Score. "sem dados" significa sem avaliações ainda.
Respostas curtas e objetivas. Evite listas longas — mencione apenas as mais relevantes.

UNIDADES DE SAÚDE DE MANAUS:
${resumo}

Formato: Nome|Tipo|Rede|Bairro,Zona|Telefone|Score`

  const messages = [
    { role: 'user',      content: systemPrompt },
    { role: 'assistant', content: 'Entendido! Vou responder sempre em português e usar os scores disponíveis para responder perguntas sobre ranking.' },
    ...historico.slice(-6),
    { role: 'user', content: mensagem },
  ]

  try {
    const resposta = await chatCompletion(messages, 500)
    return res.status(200).json({ resposta })
  } catch (err) {
    console.error('Assistente error:', err.message)
    const amigavel = err.message?.includes('429') || err.message?.includes('rate')
      ? 'O limite diário do assistente foi atingido. Tente novamente amanhã.'
      : 'Não foi possível processar sua mensagem no momento. Tente novamente em breve.'
    return res.status(500).json({ error: amigavel })
  }
}
