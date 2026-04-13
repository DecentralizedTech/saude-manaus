// api/analise.js
// POST /api/analise — Gera síntese IA dos dados de avaliação de uma unidade

import { getUnidade, getAvaliacoesUnidade } from './_kv.js'
import { chatCompletion } from './_openrouter.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const PARAM_LABEL = {
  diagnostico_escrito:         'diagnóstico por escrito',
  falta_materiais:             'falta de materiais básicos',
  tempo_espera:                'tempo de espera',
  passou_triagem:              'triagem realizada',
  macas_suficientes:           'macas suficientes',
  retornou_48h:                'retorno em 48h pelo mesmo problema',
  limpeza_visivel:             'limpeza das instalações',
  banheiros_funcionando:       'banheiros funcionando',
  prescricao_escrita:          'prescrição por escrito',
  horario_agendado:            'horário da consulta cumprido',
  plano_tratamento_escrito:    'plano de tratamento por escrito',
  leito_disponivel:            'leito disponível',
  resultado_prazo:             'resultado de exame no prazo',
  orientacao_resultado_escrita:'orientação do resultado por escrito',
  exame_prazo:                 'exame realizado no prazo',
  precisou_remarcar:           'precisou remarcar exame',
}

const INVERTIDOS = new Set(['falta_materiais', 'retornou_48h', 'precisou_remarcar'])
const TIPO_LABEL = {
  EMERGENCIA_URGENCIA: 'Emergência / Urgência', CONSULTA_ELETIVA: 'Consulta Eletiva',
  INTERNACAO: 'Internação', EXAMES_PROCEDIMENTOS: 'Exames e Procedimentos',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { unidadeId } = req.body
  if (!unidadeId) return res.status(400).json({ error: 'unidadeId obrigatório' })

  const unidade = await getUnidade(unidadeId)
  if (!unidade)  return res.status(404).json({ error: 'Unidade não encontrada' })

  const avaliacoes = await getAvaliacoesUnidade(unidadeId)
  if (avaliacoes.length === 0)
    return res.status(200).json({ analise: null, motivo: 'sem_avaliacoes' })

  const porParam = {}
  const porTipo  = {}
  for (const av of avaliacoes) {
    const tipo = av.tipoAtendimento
    if (!porTipo[tipo]) porTipo[tipo] = { scores: [], total: 0 }
    porTipo[tipo].scores.push(Number(av.score))
    porTipo[tipo].total++
    const r = av.respostas || {}
    for (const [key, val] of Object.entries(r)) {
      if (!PARAM_LABEL[key]) continue
      if (!porParam[key]) porParam[key] = { positivos: 0, total: 0 }
      porParam[key].total++
      if (typeof val === 'boolean') {
        if (INVERTIDOS.has(key) ? !val : val) porParam[key].positivos++
      } else if (typeof val === 'number' && val <= 30) porParam[key].positivos++
    }
  }

  const resumoTipos  = Object.entries(porTipo).map(([tipo, d]) =>
    `- ${TIPO_LABEL[tipo] || tipo}: score médio ${(d.scores.reduce((a,b)=>a+b,0)/d.scores.length).toFixed(1)}/100 (${d.total} avaliações)`
  ).join('\n')
  const pontosBons   = Object.entries(porParam).filter(([,d]) => d.total>0 && d.positivos/d.total>=0.7).map(([k])=>PARAM_LABEL[k])
  const pontosFracos = Object.entries(porParam).filter(([,d]) => d.total>0 && d.positivos/d.total<0.4).map(([k])=>PARAM_LABEL[k])

  const prompt = `Você é um analista de qualidade em saúde pública. Com base nos dados abaixo, escreva um parágrafo curto (3-5 frases) em português brasileiro, tom neutro e objetivo, resumindo o desempenho da unidade. Sem bullet points. Sem inventar dados.

Unidade: ${unidade.nome} (${unidade.tipo}, ${unidade.particular === 'true' ? 'Particular' : 'Público'}, ${unidade.bairro})
Total de avaliações: ${avaliacoes.length}
Scores por tipo:
${resumoTipos}
${pontosBons.length>0 ? `Pontos positivos (≥70%): ${pontosBons.join(', ')}` : ''}
${pontosFracos.length>0 ? `Pontos críticos (<40%): ${pontosFracos.join(', ')}` : ''}

Escreva apenas o parágrafo, sem título.`

  try {
    const analise = await chatCompletion([{ role: 'user', content: prompt }], 400)
    return res.status(200).json({ analise: analise.trim() })
  } catch (err) {
    console.error('OpenRouter error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
