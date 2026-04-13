// api/_kv.js
// Usa o pacote 'redis' com a REDIS_URL injetada pelo Upstash via Vercel Marketplace

import { createClient } from 'redis'

let client = null

async function getClient() {
  if (client && client.isOpen) return client
  client = createClient({ url: process.env.REDIS_URL })
  client.on('error', (err) => console.error('Redis error:', err))
  await client.connect()
  return client
}

function parseUnidade(u) {
  if (!u || !u.id) return null
  return {
    ...u,
    ativo:      u.ativo      !== 'false',
    particular: u.particular === 'true',
    lat:        u.lat  ? Number(u.lat)  : undefined,
    lng:        u.lng  ? Number(u.lng)  : undefined,
  }
}

// ─── Unidades ────────────────────────────────────────────────────────────────

export async function getUnidades() {
  const r = await getClient()
  const ids = await r.sMembers('unidades:ids')
  if (!ids || ids.length === 0) return []
  const pipeline = r.multi()
  ids.forEach(id => pipeline.hGetAll(`unidade:${id}`))
  const results = await pipeline.exec()
  return results.map(parseUnidade).filter(Boolean)
}

export async function getUnidade(id) {
  const r = await getClient()
  const u = await r.hGetAll(`unidade:${id}`)
  return parseUnidade(u)
}

export async function saveUnidade(unidade) {
  const r = await getClient()
  const flat = Object.fromEntries(
    Object.entries(unidade).map(([k, v]) => [k, String(v)])
  )
  await r.hSet(`unidade:${unidade.id}`, flat)
  await r.sAdd('unidades:ids', unidade.id)
  return unidade
}

export async function deleteUnidade(id) {
  const r = await getClient()
  await r.hSet(`unidade:${id}`, { ativo: 'false' })
}

// ─── Avaliações ──────────────────────────────────────────────────────────────

export async function getAvaliacoesUnidade(unidadeId) {
  const r = await getClient()
  const ids = await r.sMembers(`avaliacoes:unidade:${unidadeId}`)
  if (!ids || ids.length === 0) return []
  const pipeline = r.multi()
  ids.forEach(id => pipeline.hGetAll(`avaliacao:${id}`))
  const results = await pipeline.exec()
  return results.filter(a => a && a.id).map(a => ({
    ...a,
    score: Number(a.score),
    respostas: (() => { try { return JSON.parse(a.respostas) } catch { return {} } })()
  }))
}

export async function saveAvaliacao(avaliacao) {
  const r = await getClient()
  await r.hSet(`avaliacao:${avaliacao.id}`, {
    id: avaliacao.id,
    unidadeId: avaliacao.unidadeId,
    usuarioId: avaliacao.usuarioId,
    tipoAtendimento: avaliacao.tipoAtendimento,
    respostas: JSON.stringify(avaliacao.respostas),
    score: String(avaliacao.score),
    createdAt: avaliacao.createdAt,
  })
  await r.sAdd(`avaliacoes:unidade:${avaliacao.unidadeId}`, avaliacao.id)
  return avaliacao
}

export async function deleteAvaliacao(avaliacaoId, unidadeId) {
  const r = await getClient()
  await r.del(`avaliacao:${avaliacaoId}`)
  await r.sRem(`avaliacoes:unidade:${unidadeId}`, avaliacaoId)
}


  const r = await getClient()
  const mes = new Date().toISOString().slice(0, 7)
  return r.get(`avaliacao-lock:${usuarioId}:${unidadeId}:${tipo}:${mes}`)
}

export async function setAvaliacaoLock(usuarioId, unidadeId, tipo) {
  const r = await getClient()
  const mes = new Date().toISOString().slice(0, 7)
  const key = `avaliacao-lock:${usuarioId}:${unidadeId}:${tipo}:${mes}`
  await r.set(key, '1', { EX: 60 * 60 * 24 * 35 })
}

// ─── Usuários ────────────────────────────────────────────────────────────────

export async function getUsuario(id) {
  const r = await getClient()
  const u = await r.hGetAll(`usuario:${id}`)
  return u && u.id ? u : null
}

export async function getUsuarioByProvider(provider, providerId) {
  const r = await getClient()
  const id = await r.get(`usuario-provider:${provider}:${providerId}`)
  if (!id) return null
  const u = await r.hGetAll(`usuario:${id}`)
  return u && u.id ? u : null
}

export async function saveUsuario(usuario) {
  const r = await getClient()
  const flat = Object.fromEntries(
    Object.entries(usuario).map(([k, v]) => [k, String(v)])
  )
  await r.hSet(`usuario:${usuario.id}`, flat)
  await r.set(`usuario-provider:${usuario.provider}:${usuario.providerId}`, usuario.id)
  return usuario
}
