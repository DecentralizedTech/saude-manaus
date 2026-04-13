// api/auth.js — POST /api/auth?action=social|promote
import { v4 as uuid } from 'uuid'
import { signToken } from './_auth.js'
import { getUsuarioByProvider, saveUsuario, getUsuario } from './_kv.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function verifyGoogleToken(credential) {
  const parts = credential.split('.')
  if (parts.length !== 3) throw new Error('Token inválido')
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Token não pertence a este app')
  if (Date.now() / 1000 > payload.exp) throw new Error('Token expirado')
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) throw new Error('Issuer inválido')
  return { providerId: payload.sub, email: payload.email, nome: payload.name, avatar: payload.picture || '' }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const action = new URL(req.url, `http://${req.headers.host}`).searchParams.get('action')

  // POST /api/auth?action=social
  if (action === 'social') {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: 'Token Google ausente' })
    let googleUser
    try { googleUser = await verifyGoogleToken(credential) }
    catch (err) { return res.status(401).json({ error: `Token inválido: ${err.message}` }) }
    const { providerId, email, nome, avatar } = googleUser
    let usuario = await getUsuarioByProvider('google', providerId)
    if (!usuario) {
      usuario = { id: uuid(), provider: 'google', providerId, email, nome, avatar, isAdmin: false }
      await saveUsuario(usuario)
    } else {
      usuario = { ...usuario, nome, avatar }
      await saveUsuario(usuario)
    }
    const token = await signToken({ userId: usuario.id, isAdmin: usuario.isAdmin === 'true' || usuario.isAdmin === true })
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, avatar: usuario.avatar, isAdmin: usuario.isAdmin === 'true' || usuario.isAdmin === true }
    })
  }

  // POST /api/auth?action=promote
  if (action === 'promote') {
    const { userId, secret } = req.body
    if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Não autorizado' })
    const usuario = await getUsuario(userId)
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' })
    await saveUsuario({ ...usuario, isAdmin: true })
    return res.status(200).json({ message: 'Usuário promovido a admin' })
  }

  return res.status(400).json({ error: 'action inválida' })
}
