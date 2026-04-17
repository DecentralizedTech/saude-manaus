// api/avaliacoes.js — POST /api/avaliacoes  |  GET /api/avaliacoes?unidadeId=...
import { v4 as uuid } from 'uuid'
import { saveAvaliacao, getAvaliacoesUnidade, getAvaliacaoKey, setAvaliacaoLock, deleteAvaliacao } from './_kv.js'
import { calcularScore, calcularScoreGeral } from './_score.js'
import { getAuthUser } from './_auth.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const TIPO_LABEL = {
  EMERGENCIA_URGENCIA: 'Emergência / Urgência', CONSULTA_ELETIVA: 'Consulta Eletiva',
  INTERNACAO: 'Internação', EXAMES_PROCEDIMENTOS: 'Exames e Procedimentos',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const url = new URL(req.url, `http://${req.headers.host}`)
  const unidadeId = url.searchParams.get('unidadeId')

  // GET /api/avaliacoes?unidadeId=...
  if (req.method === 'GET' && unidadeId) {
    const avaliacoes = await getAvaliacoesUnidade(unidadeId)

    // ?raw=true — retorna lista bruta para o admin
    if (url.searchParams.get('raw') === 'true') {
      return res.status(200).json(avaliacoes)
    }
    const porTipo = {}
    for (const av of avaliacoes) {
      if (!porTipo[av.tipoAtendimento]) porTipo[av.tipoAtendimento] = []
      porTipo[av.tipoAtendimento].push(Number(av.score))
    }

    const porParam = {}
    const INVERTIDOS = new Set(['falta_materiais', 'retornou_48h', 'precisou_remarcar'])
    for (const av of avaliacoes) {
      const r = av.respostas || {}
      for (const [key, val] of Object.entries(r)) {
        if (!porParam[key]) porParam[key] = { positivos: 0, total: 0 }
        porParam[key].total++
        if (typeof val === 'boolean') {
          if (INVERTIDOS.has(key) ? !val : val) porParam[key].positivos++
        } else if (typeof val === 'number' && val <= 30) porParam[key].positivos++
      }
    }

    const PARAM_LABEL = {
      diagnostico_escrito: 'Diagnóstico por escrito', falta_materiais: 'Falta de materiais',
      tempo_espera: 'Tempo de espera', passou_triagem: 'Triagem realizada',
      macas_suficientes: 'Macas suficientes', retornou_48h: 'Retorno em 48h',
      limpeza_visivel: 'Limpeza', banheiros_funcionando: 'Banheiros ok',
      prescricao_escrita: 'Prescrição por escrito', horario_agendado: 'Horário cumprido',
      plano_tratamento_escrito: 'Plano de tratamento', leito_disponivel: 'Leito disponível',
      resultado_prazo: 'Resultado no prazo', orientacao_resultado_escrita: 'Orientação do resultado',
      exame_prazo: 'Exame no prazo', precisou_remarcar: 'Precisou remarcar',
    }

    // Parâmetros agrupados por tipo de atendimento
    const porParamPorTipo = {}
    for (const av of avaliacoes) {
      const tipo = av.tipoAtendimento
      if (!porParamPorTipo[tipo]) porParamPorTipo[tipo] = {}
      const r = av.respostas || {}
      for (const [key, val] of Object.entries(r)) {
        if (!PARAM_LABEL[key]) continue
        if (!porParamPorTipo[tipo][key]) porParamPorTipo[tipo][key] = { positivos: 0, total: 0 }
        porParamPorTipo[tipo][key].total++
        if (typeof val === 'boolean') {
          if (INVERTIDOS.has(key) ? !val : val) porParamPorTipo[tipo][key].positivos++
        } else if (typeof val === 'number' && val <= 30) porParamPorTipo[tipo][key].positivos++
      }
    }

    const parametrosPorTipo = Object.entries(porParamPorTipo).map(([tipo, params]) => ({
      tipo, label: TIPO_LABEL[tipo] || tipo,
      parametros: Object.entries(params).map(([key, d]) => ({
        key, label: PARAM_LABEL[key] || key,
        percentualPositivo: Math.round(d.positivos / d.total * 100),
        total: d.total, invertido: INVERTIDOS.has(key),
      })).filter(p => p.total > 0 && p.percentualPositivo > 0).sort((a, b) => b.percentualPositivo - a.percentualPositivo)
    }))

    const estatisticas = Object.entries(porTipo).map(([tipo, scores]) => ({
      tipo, label: TIPO_LABEL[tipo] || tipo,
      media: Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10,
      total: scores.length, min: Math.min(...scores), max: Math.max(...scores),
    }))

    const parametros = Object.entries(porParam)
      .filter(([, d]) => d.total >= 2) // só mostra com 2+ respostas para ser representativo
      .map(([key, d]) => ({
        key, label: PARAM_LABEL[key] || key,
        percentualPositivo: Math.round(d.positivos / d.total * 100),
        total: d.total, invertido: INVERTIDOS.has(key),
      })).sort((a,b) => b.percentualPositivo - a.percentualPositivo)

    const porSemana = {}
    for (const av of avaliacoes) {
      if (!av.createdAt) continue
      const d = new Date(av.createdAt)
      const dia = d.getDay()
      const diff = d.getDate() - dia + (dia === 0 ? -6 : 1)
      const semana = new Date(d.setDate(diff)).toISOString().slice(0, 10)
      if (!porSemana[semana]) porSemana[semana] = { scores: [], mediaPorTipo: {} }
      porSemana[semana].scores.push(Number(av.score))
      if (!porSemana[semana].mediaPorTipo[av.tipoAtendimento]) porSemana[semana].mediaPorTipo[av.tipoAtendimento] = []
      porSemana[semana].mediaPorTipo[av.tipoAtendimento].push(Number(av.score))
    }
    const serieScore = Object.entries(porSemana).sort(([a],[b])=>a.localeCompare(b)).map(([semana,d]) => {
      const mediaPorTipo = {}
      for (const [tipo,scores] of Object.entries(d.mediaPorTipo))
        mediaPorTipo[tipo] = scores.reduce((a,b)=>a+b,0)/scores.length
      return { semana, scoreGeral: Math.round(calcularScoreGeral(mediaPorTipo)*10)/10, total: d.scores.length }
    })

    return res.status(200).json({ estatisticas, parametros, parametrosPorTipo, serieScore, totalAvaliacoes: avaliacoes.length, scorePublicavel: avaliacoes.length >= 1 })
  }

  // POST /api/avaliacoes
  if (req.method === 'POST') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: 'Login necessário para avaliar' })
    const { unidadeId: uid, tipoAtendimento, respostas } = req.body
    if (!uid || !tipoAtendimento || !respostas) return res.status(400).json({ error: 'Dados incompletos' })
    const lock = await getAvaliacaoKey(user.userId, uid, tipoAtendimento)
    if (lock) return res.status(429).json({ error: 'Você já avaliou esta unidade nesta categoria este mês.' })
    const score = calcularScore(tipoAtendimento, respostas)
    const avaliacao = { id: uuid(), unidadeId: uid, usuarioId: user.userId, tipoAtendimento, respostas, score, createdAt: new Date().toISOString() }
    await saveAvaliacao(avaliacao)
    await setAvaliacaoLock(user.userId, uid, tipoAtendimento)
    return res.status(201).json({ score, avaliacao })
  }

  // DELETE /api/avaliacoes?id=...&unidadeId=...
  if (req.method === 'DELETE') {
    const user = await getAuthUser(req)
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Acesso restrito a administradores' })
    const avaliacaoId = url.searchParams.get('id')
    const uid         = url.searchParams.get('unidadeId')
    if (!avaliacaoId || !uid) return res.status(400).json({ error: 'id e unidadeId obrigatórios' })
    await deleteAvaliacao(avaliacaoId, uid)
    return res.status(200).json({ message: 'Avaliação removida' })
  }

  return res.status(405).end()
}
