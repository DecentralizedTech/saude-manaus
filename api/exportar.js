// api/exportar.js
// GET /api/exportar — exporta todas as avaliações em CSV (admin only)

import { getUnidades, getAvaliacoesUnidade } from './_kv.js'
import { getAuthUser } from './_auth.js'

const TIPO_LABEL = {
  EMERGENCIA_URGENCIA:  'Emergência / Urgência',
  CONSULTA_ELETIVA:     'Consulta Eletiva',
  INTERNACAO:           'Internação',
  EXAMES_PROCEDIMENTOS: 'Exames e Procedimentos',
}

const PARAM_LABEL = {
  diagnostico_escrito:          'Diagnóstico por escrito',
  falta_materiais:              'Falta de materiais',
  tempo_espera:                 'Tempo de espera (min)',
  passou_triagem:               'Passou por triagem',
  macas_suficientes:            'Macas suficientes',
  retornou_48h:                 'Retornou em 48h',
  limpeza_visivel:              'Limpeza visível',
  banheiros_funcionando:        'Banheiros funcionando',
  prescricao_escrita:           'Prescrição por escrito',
  horario_agendado:             'Horário cumprido',
  plano_tratamento_escrito:     'Plano de tratamento',
  leito_disponivel:             'Leito disponível',
  resultado_prazo:              'Resultado no prazo',
  orientacao_resultado_escrita: 'Orientação do resultado',
  exame_prazo:                  'Exame no prazo',
  precisou_remarcar:            'Precisou remarcar',
}

function esc(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const user = await getAuthUser(req)
  if (!user || !user.isAdmin) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const unidades = await getUnidades()
  const rows = []

  // Cabeçalho
  const params = Object.keys(PARAM_LABEL)
  const header = [
    'Data', 'Unidade', 'Tipo', 'Rede', 'Bairro', 'Zona',
    'Tipo de Atendimento', 'Score',
    ...params.map(p => PARAM_LABEL[p])
  ]
  rows.push(header.map(esc).join(','))

  for (const u of unidades) {
    const avaliacoes = await getAvaliacoesUnidade(u.id)
    for (const av of avaliacoes) {
      const r = av.respostas || {}
      const data = av.createdAt ? new Date(av.createdAt).toLocaleDateString('pt-BR') : ''
      const row = [
        data,
        u.nome,
        u.tipo,
        u.particular === 'true' ? 'Particular' : 'Público',
        u.bairro,
        u.zona,
        TIPO_LABEL[av.tipoAtendimento] || av.tipoAtendimento,
        Number(av.score).toFixed(1),
        ...params.map(p => {
          const v = r[p]
          if (v === undefined || v === null) return ''
          if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
          return String(v)
        }),
      ]
      rows.push(row.map(esc).join(','))
    }
  }

  const csv = '\uFEFF' + rows.join('\n') // BOM para Excel reconhecer UTF-8

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="avaliacoes-saude-manaus-${new Date().toISOString().slice(0,10)}.csv"`)
  return res.status(200).send(csv)
}
