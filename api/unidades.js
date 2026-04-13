// api/unidades.js — GET|POST /api/unidades  |  GET|PUT|DELETE /api/unidades?id=...
import { v4 as uuid } from 'uuid'
import { getUnidades, getUnidade, saveUnidade, deleteUnidade, getAvaliacoesUnidade } from './_kv.js'
import { calcularScoreGeral } from './_score.js'
import { getAuthUser } from './_auth.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function enriquece(u) {
  const avaliacoes = await getAvaliacoesUnidade(u.id)
  const porTipo = {}
  for (const av of avaliacoes) {
    if (!porTipo[av.tipoAtendimento]) porTipo[av.tipoAtendimento] = []
    porTipo[av.tipoAtendimento].push(Number(av.score))
  }
  const mediaPorTipo = {}
  for (const [tipo, scores] of Object.entries(porTipo))
    mediaPorTipo[tipo] = Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10
  const scoreGeral = avaliacoes.length >= 1 ? calcularScoreGeral(mediaPorTipo) : 0
  return { ...u, scoreGeral, scoresPorTipo: mediaPorTipo, totalAvaliacoes: avaliacoes.length }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {

  const url = new URL(req.url, `http://${req.headers.host}`)
  const id  = url.searchParams.get('id')
  const { tipo, zona, busca } = Object.fromEntries(url.searchParams)

  // GET /api/unidades?id=... (item único)
  if (req.method === 'GET' && id) {
    const u = await getUnidade(id)
    if (!u) return res.status(404).json({ error: 'Unidade não encontrada' })
    return res.status(200).json(await enriquece(u))
  }

  // GET /api/unidades (lista)
  if (req.method === 'GET') {
    let unidades = (await getUnidades()).filter(u => u.ativo !== false && u.ativo !== 'false')
    if (tipo)  unidades = unidades.filter(u => u.tipo === tipo)
    if (zona)  unidades = unidades.filter(u => u.zona === zona)
    if (busca) { const q = busca.toLowerCase(); unidades = unidades.filter(u => u.nome.toLowerCase().includes(q) || u.bairro.toLowerCase().includes(q)) }
    const result = await Promise.all(unidades.map(enriquece))
    return res.status(200).json(result.sort((a,b) => b.scoreGeral - a.scoreGeral))
  }

  // Rotas protegidas
  const user = await getAuthUser(req)
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  // POST /api/unidades
  if (req.method === 'POST') {
    const { nome, tipo: t, endereco, bairro, zona: z, telefone, particular, lat, lng } = req.body
    if (!nome || !t || !endereco || !bairro || !z) return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo, endereco, bairro, zona' })
    const nova = { id: uuid(), nome, tipo: t, endereco, bairro, zona: z, telefone: telefone||'', particular: !!particular, lat: lat||null, lng: lng||null, ativo: true }
    await saveUnidade(nova)
    return res.status(201).json(nova)
  }

  // PUT /api/unidades?id=...
  if (req.method === 'PUT' && id) {
    const existente = await getUnidade(id)
    if (!existente) return res.status(404).json({ error: 'Unidade não encontrada' })
    await saveUnidade({ ...existente, ...req.body, id })
    return res.status(200).json({ ...existente, ...req.body, id })
  }

  // DELETE /api/unidades?id=...
  if (req.method === 'DELETE' && id) {
    await deleteUnidade(id)
    return res.status(200).json({ message: 'Unidade desativada' })
  }

  return res.status(405).end()
  } catch (err) {
    console.error('unidades error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
