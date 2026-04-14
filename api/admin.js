// api/admin.js — GET /api/admin?op=seed|seed-avaliacoes|reset
import { v4 as uuid } from 'uuid'
import { getUnidades, saveUnidade, saveAvaliacao } from './_kv.js'
import { calcularScore } from './_score.js'
import { createClient } from 'redis'

const UNIDADES = [
  { nome: 'HPS 28 de Agosto', tipo: 'HOSPITAL', endereco: 'Av. Mário Ypiranga, 1581', bairro: 'Adrianópolis', zona: 'Centro-Sul', telefone: '(92) 3643-4100', lat: -3.1078, lng: -59.9889, particular: false },
  { nome: 'HPS João Lúcio Pereira Machado', tipo: 'HOSPITAL', endereco: 'Av. Cosme Ferreira, 3937', bairro: 'São José', zona: 'Leste', telefone: '(92) 3878-4100', lat: -3.0732, lng: -59.9302, particular: false },
  { nome: 'HPS Platão Araújo', tipo: 'HOSPITAL', endereco: 'Av. Autaz Mirim, 3920', bairro: 'Jorge Teixeira', zona: 'Leste', telefone: '(92) 3214-3700', lat: -3.0518, lng: -59.9723, particular: false },
  { nome: 'Hospital Delphina Aziz', tipo: 'HOSPITAL', endereco: 'Av. Torquato Tapajós, 9250', bairro: 'Colônia Terra Nova', zona: 'Norte', telefone: '(92) 3216-6700', lat: -2.9912, lng: -60.0601, particular: false },
  { nome: 'Hospital Infantil Dr. Fajardo', tipo: 'HOSPITAL', endereco: 'Rua Senador Álvaro Maia, 1280', bairro: 'Centro', zona: 'Centro-Sul', telefone: '(92) 3633-4190', lat: -3.1289, lng: -60.0198, particular: false },
  { nome: 'HPSC Zona Oeste', tipo: 'HOSPITAL', endereco: 'Av. Rodrigo Otávio, 1458', bairro: 'Cidade Nova', zona: 'Oeste', telefone: '(92) 3214-0900', lat: -3.0867, lng: -60.0534, particular: false },
  { nome: 'HPSC Zona Sul', tipo: 'HOSPITAL', endereco: 'Rua Bento José de Lima, 33', bairro: 'Colônia Oliveira Machado', zona: 'Sul', telefone: '(92) 3623-4200', lat: -3.1188503376073218, lng: -60.003028706104466, particular: false },
  { nome: 'HPSC Zona Leste', tipo: 'HOSPITAL', endereco: 'Av. Cosme Ferreira, 7000', bairro: 'Coroado', zona: 'Leste', telefone: '(92) 3643-0600', lat: -3.0789, lng: -59.9645, particular: false },
  { nome: 'Hospital Universitário Getúlio Vargas', tipo: 'HOSPITAL', endereco: 'R. Tomas de Vila Nova, 300', bairro: 'Praça 14 de Janeiro', zona: 'Centro-Sul', telefone: '(92) 3305-4764', lat: -3.1334, lng: -60.0212, particular: false },
  { nome: 'Fundação Hospital Adriano Jorge', tipo: 'HOSPITAL', endereco: 'Av. Carvalho Leal, 1778', bairro: 'Cachoeirinha', zona: 'Centro-Sul', telefone: '(92) 3612-2200', lat: -3.1156, lng: -60.0089, particular: false },
  { nome: 'Hospital de Trauma de Manaus', tipo: 'HOSPITAL', endereco: 'Av. Mário Ypiranga, 1620B', bairro: 'Adrianópolis', zona: 'Centro-Sul', telefone: '(92) 98240-2066', lat: -3.1082, lng: -59.9885, particular: false },
  { nome: 'Hospital e Pronto Socorro da Criança', tipo: 'HOSPITAL', endereco: 's/n', bairro: 'Cidade Nova', zona: 'Oeste', telefone: '', lat: -3.0944376879638487, lng: -60.05763169212106, particular: false },
  { nome: 'UPA José Rodrigues', tipo: 'UPA', endereco: 'Av. Constantino Nery, 3219', bairro: 'Chapada', zona: 'Centro-Oeste', telefone: '(92) 3643-3800', lat: -3.0923, lng: -60.0167, particular: false },
  { nome: 'UPA Campos Salles', tipo: 'UPA', endereco: 'Rua Campos Salles, 81', bairro: 'Praça 14 de Janeiro', zona: 'Centro-Sul', telefone: '(92) 3633-3880', lat: -3.1312, lng: -60.0234, particular: false },
  { nome: 'SPA Alvorada', tipo: 'SPA', endereco: 'Rua Uirapuru, s/n', bairro: 'Alvorada', zona: 'Centro-Oeste', telefone: '(92) 3214-8600', lat: -3.0934, lng: -60.0312, particular: false },
  { nome: 'SPA Coroado', tipo: 'SPA', endereco: 'Rua Acre, s/n', bairro: 'Coroado', zona: 'Leste', telefone: '(92) 3643-4500', lat: -3.0812, lng: -59.9801, particular: false },
  { nome: 'SPA Zona Sul', tipo: 'SPA', endereco: 'Rua Bento José de Lima, 33', bairro: 'Colônia Oliveira Machado', zona: 'Sul', telefone: '(92) 3623-4300', lat: -3.146247097377544, lng: -60.008401482468315, particular: false },
  { nome: 'SPA Eliameme Rodrigues Mady', tipo: 'SPA', endereco: 'Av. Noel Nutels, s/n', bairro: 'Cidade Nova', zona: 'Norte', telefone: '(92) 3216-7700', lat: -3.0245, lng: -60.0489, particular: false },
  { nome: 'SPA Joventina Dias', tipo: 'SPA', endereco: 'Av. Joventina Dias, s/n', bairro: 'Santo Antônio', zona: 'Oeste', telefone: '(92) 3214-7800', lat: -3.1023, lng: -60.0578, particular: false },
  { nome: 'SPA Chapot Prevost', tipo: 'SPA', endereco: 'Rua Chapot Prevost, s/n', bairro: 'Compensa', zona: 'Oeste', telefone: '(92) 3214-7100', lat: -3.1067, lng: -60.0689, particular: false },
  { nome: 'SPA José Lins', tipo: 'SPA', endereco: 'Av. Autaz Mirim, s/n', bairro: 'Tancredo Neves', zona: 'Leste', telefone: '(92) 3878-0100', lat: -3.0589, lng: -59.9512, particular: false },
  { nome: 'SPA Danilo Corrêa', tipo: 'SPA', endereco: 'Rua Danilo Corrêa, s/n', bairro: 'Cidade Nova', zona: 'Centro-Oeste', telefone: '(92) 3214-4900', lat: -3.029366395531683, lng: -59.97744437308408, particular: false },
  { nome: 'SPA São Raimundo', tipo: 'SPA', endereco: 'Av. São Raimundo, s/n', bairro: 'São Raimundo', zona: 'Oeste', telefone: '(92) 3214-5600', lat: -3.1272493111232293, lng: -60.03737622095611, particular: false },
  { nome: 'SPA da Galileia', tipo: 'SPA', endereco: 's/n', bairro: 'Nova Cidade', zona: 'Norte', telefone: '', lat: -3.014478691284401, lng: -59.99032608842596, particular: false },
  { nome: 'Check Up Hospital', tipo: 'HOSPITAL', endereco: 'Av. Umberto Calderaro, 500', bairro: 'Nossa Senhora das Graças', zona: 'Centro-Sul', telefone: '(92) 2125-5959', lat: -3.1089, lng: -60.0067, particular: true },
  { nome: 'Hospital Santa Júlia', tipo: 'HOSPITAL', endereco: 'Rod. Álvaro Maia, 510', bairro: 'Flores', zona: 'Centro-Sul', telefone: '(92) 2121-9000', lat: -3.0934, lng: -59.9978, particular: true },
  { nome: 'Hospital Beneficente Português', tipo: 'HOSPITAL', endereco: 'Av. Joaquim Nabuco, 1359', bairro: 'Centro', zona: 'Centro-Sul', telefone: '(92) 2101-2500', lat: -3.1312, lng: -60.0198, particular: true },
  { nome: 'Hospital e Maternidade Santo Alberto', tipo: 'HOSPITAL', endereco: 'Av. Manicoré, 536', bairro: 'Japiim', zona: 'Sul', telefone: '(92) 2101-3000', lat: -3.1189, lng: -60.0034, particular: true },
  { nome: 'Hospital Pró-Saúde Dr. Luiz Fernando', tipo: 'HOSPITAL', endereco: 'R. Tapajós, 645', bairro: 'Nossa Senhora das Graças', zona: 'Centro-Sul', telefone: '(92) 3348-0002', lat: -3.1067, lng: -60.0056, particular: true },
  { nome: 'Hospital Geral Unimed', tipo: 'HOSPITAL', endereco: 'Av. Constantino Nery, 1678', bairro: 'Chapada', zona: 'Centro-Oeste', telefone: '(92) 4009-8686', lat: -3.0978, lng: -60.0145, particular: true },
  { nome: 'Hospital Adventista de Manaus', tipo: 'HOSPITAL', endereco: 'Av. Gov. Danilo de Matos Areosa, 139', bairro: 'Flores', zona: 'Centro-Sul', telefone: '(92) 2123-1311', lat: -3.0912, lng: -59.9989, particular: true },
  { nome: 'Hospital Rio Negro', tipo: 'HOSPITAL', endereco: 'R. Tapajós, 561', bairro: 'Nossa Senhora das Graças', zona: 'Centro-Sul', telefone: '4002-3633', lat: -3.1071, lng: -60.0061, particular: true },
  { nome: 'Hospital São Lucas Hapvida', tipo: 'HOSPITAL', endereco: 'R. Alexandre Amorim, 470', bairro: 'Praça 14 de Janeiro', zona: 'Centro-Sul', telefone: '4002-3633', lat: -3.1298, lng: -60.0223, particular: true },
  { nome: 'Samel', tipo: 'HOSPITAL', endereco: 'Av. Joaquim Nabuco, 1755', bairro: 'Centro', zona: 'Centro-Sul', telefone: '', lat: -3.1334, lng: -60.0201, particular: true },
  { nome: 'Hospital e Maternidade Rio Amazonas', tipo: 'HOSPITAL', endereco: 'R. Prof. Marciano Armond, 1401', bairro: 'Aleixo', zona: 'Centro-Sul', telefone: '', lat: -3.0956, lng: -59.9934, particular: true },
  { nome: 'Hospital Samel Boulevard', tipo: 'HOSPITAL', endereco: 'Rod. Álvaro Maia, 1445', bairro: 'Flores', zona: 'Centro-Sul', telefone: '(92) 2129-2200', lat: -3.0889, lng: -59.9956, particular: true },
  { nome: 'Hospital Pediátrico Rio Solimões', tipo: 'HOSPITAL', endereco: 'Rod. Álvaro Maia, 1131', bairro: 'Flores', zona: 'Centro-Sul', telefone: '', lat: -3.0912, lng: -59.9967, particular: true },
  { nome: 'Day Hospital Vieiralves', tipo: 'HOSPITAL', endereco: 'Rua Rio Amapá, 124', bairro: 'Nossa Senhora das Graças', zona: 'Centro-Sul', telefone: '(92) 98409-5436', lat: -3.1056, lng: -60.0045, particular: true },

  // ── Policlínicas ─────────────────────────────────────────────────────────────
  { nome: 'Policlínica Monte das Oliveiras', tipo: 'POLICLINICA', endereco: 'Rua Grumixava, s/n', bairro: 'Monte das Oliveiras', zona: 'Norte', telefone: '', lat: -2.9978, lng: -60.0123, particular: false },
  { nome: 'Policlínica Parque Dez', tipo: 'POLICLINICA', endereco: 'Rua do Comércio, s/n', bairro: 'Parque Dez de Novembro', zona: 'Centro-Sul', telefone: '', lat: -3.0867, lng: -59.9934, particular: false },
  { nome: 'Policlínica Compensa', tipo: 'POLICLINICA', endereco: 'Rua 23 de Dezembro, s/n', bairro: 'Compensa II', zona: 'Oeste', telefone: '', lat: -3.1023, lng: -60.0712, particular: false },
  { nome: 'Policlínica Gov. Gilberto Mestrinho', tipo: 'POLICLINICA', endereco: 'Av. Getúlio Vargas, 341', bairro: 'Centro', zona: 'Centro-Sul', telefone: '(92) 99213-8618', lat: -3.1334, lng: -60.0189, particular: false },
  { nome: 'Policlínica Codajás', tipo: 'POLICLINICA', endereco: 'Av. Codajás, 26', bairro: 'Cachoeirinha', zona: 'Centro-Sul', telefone: '(92) 3612-4200', lat: -3.1145, lng: -60.0078, particular: false },
  { nome: 'Policlínica João dos Santos Braga', tipo: 'POLICLINICA', endereco: 'Av. Margarita, s/n', bairro: 'Nova Cidade', zona: 'Norte', telefone: '', lat: -3.0167, lng: -60.0401, particular: false },
  { nome: 'Policlínica Antônio Aleixo', tipo: 'POLICLINICA', endereco: 'Av. Getúlio Vargas, s/n', bairro: 'Colônia Antônio Aleixo', zona: 'Leste', telefone: '(92) 98411-8139', lat: -3.0823, lng: -59.9334, particular: false },
  { nome: 'Policlínica Dr. José Lins de Albuquerque', tipo: 'POLICLINICA', endereco: 'R. Maracanã, s/n', bairro: 'Redenção', zona: 'Centro-Oeste', telefone: '(92) 3652-8517', lat: -3.0812, lng: -60.0134, particular: false },
]

const RESPOSTAS_TESTE = [
  { tipoAtendimento: 'EMERGENCIA_URGENCIA', respostas: { diagnostico_escrito: true, falta_materiais: false, tempo_espera: 20, passou_triagem: true, macas_suficientes: true, retornou_48h: false, limpeza_visivel: true, banheiros_funcionando: true } },
  { tipoAtendimento: 'EMERGENCIA_URGENCIA', respostas: { diagnostico_escrito: true, falta_materiais: false, tempo_espera: 45, passou_triagem: true, macas_suficientes: false, retornou_48h: false, limpeza_visivel: true, banheiros_funcionando: true } },
  { tipoAtendimento: 'EMERGENCIA_URGENCIA', respostas: { diagnostico_escrito: false, falta_materiais: true, tempo_espera: 90, passou_triagem: false, macas_suficientes: false, retornou_48h: true, limpeza_visivel: false, banheiros_funcionando: false } },
  { tipoAtendimento: 'CONSULTA_ELETIVA', respostas: { prescricao_escrita: true, horario_agendado: true, falta_materiais: false, passou_triagem: true, limpeza_visivel: true, banheiros_funcionando: true } },
  { tipoAtendimento: 'CONSULTA_ELETIVA', respostas: { prescricao_escrita: false, horario_agendado: false, falta_materiais: true, passou_triagem: false, limpeza_visivel: false, banheiros_funcionando: true } },
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const url    = new URL(req.url, `http://${req.headers.host}`)
  const op     = url.searchParams.get('op')
  const secret = url.searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Não autorizado' })

  // op=reset — apaga tudo
  if (op === 'reset') {
    const r = createClient({ url: process.env.REDIS_URL })
    await r.connect(); await r.flushDb(); await r.disconnect()
    return res.status(200).json({ message: 'Reset completo! Rode ?op=seed para recriar as unidades.' })
  }

  // op=seed — cria/atualiza unidades
  if (op === 'seed') {
    const existentes = await getUnidades()
    const porNome = Object.fromEntries(existentes.map(u => [u.nome, u]))
    let criadas = 0, atualizadas = 0
    for (const dados of UNIDADES) {
      const ex = porNome[dados.nome]
      if (!ex) { await saveUnidade({ id: uuid(), ...dados, ativo: true }); criadas++ }
      else { await saveUnidade({ ...ex, ...dados, id: ex.id }); atualizadas++ }
    }
    return res.status(200).json({ message: `Seed: ${criadas} criadas, ${atualizadas} atualizadas.`, total: UNIDADES.length })
  }

  // op=seed-avaliacoes — cria avaliações de teste
  if (op === 'seed-avaliacoes') {
    const unidades = await getUnidades()
    let total = 0
    for (const u of unidades) {
      for (const modelo of RESPOSTAS_TESTE) {
        await saveAvaliacao({ id: uuid(), unidadeId: u.id, usuarioId: `seed-${uuid()}`, tipoAtendimento: modelo.tipoAtendimento, respostas: modelo.respostas, score: calcularScore(modelo.tipoAtendimento, modelo.respostas), createdAt: new Date().toISOString() })
        total++
      }
    }
    return res.status(200).json({ message: `${total} avaliações de teste criadas.` })
  }

  // op=import-csv — restaura avaliações a partir de JSON (convertido do CSV)
  if (op === 'import-csv') {
    const { avaliacoes: dados } = req.body || {}
    if (!dados || !Array.isArray(dados)) return res.status(400).json({ error: 'Body deve ter { avaliacoes: [...] }' })

    const unidades = await getUnidades()
    const porNome  = Object.fromEntries(unidades.map(u => [u.nome.trim().toLowerCase(), u]))

    const TIPO_MAP = {
      'emergência / urgência': 'EMERGENCIA_URGENCIA',
      'consulta eletiva':      'CONSULTA_ELETIVA',
      'internação':            'INTERNACAO',
      'exames e procedimentos':'EXAMES_PROCEDIMENTOS',
    }
    const PARAM_MAP = {
      'Diagnóstico por escrito':   'diagnostico_escrito',
      'Falta de materiais':        'falta_materiais',
      'Tempo de espera (min)':     'tempo_espera',
      'Passou por triagem':        'passou_triagem',
      'Macas suficientes':         'macas_suficientes',
      'Retornou em 48h':           'retornou_48h',
      'Limpeza visível':           'limpeza_visivel',
      'Banheiros funcionando':     'banheiros_funcionando',
      'Prescrição por escrito':    'prescricao_escrita',
      'Horário cumprido':          'horario_agendado',
      'Plano de tratamento':       'plano_tratamento_escrito',
      'Leito disponível':          'leito_disponivel',
      'Resultado no prazo':        'resultado_prazo',
      'Orientação do resultado':   'orientacao_resultado_escrita',
      'Exame no prazo':            'exame_prazo',
      'Precisou remarcar':         'precisou_remarcar',
    }

    let importadas = 0, ignoradas = 0
    for (const row of dados) {
      const unidade = porNome[row['Unidade']?.trim().toLowerCase()]
      if (!unidade) { ignoradas++; continue }
      const tipoAtendimento = TIPO_MAP[row['Tipo de Atendimento']?.toLowerCase()]
      if (!tipoAtendimento) { ignoradas++; continue }

      const respostas = {}
      for (const [col, key] of Object.entries(PARAM_MAP)) {
        const v = row[col]
        if (v === '' || v === undefined || v === null) continue
        if (key === 'tempo_espera') respostas[key] = Number(v)
        else respostas[key] = v === 'Sim'
      }

      await saveAvaliacao({
        id: uuid(), unidadeId: unidade.id,
        usuarioId: `import-${uuid()}`,
        tipoAtendimento, respostas,
        score: Number(row['Score']) || 0,
        createdAt: new Date().toISOString(),
      })
      importadas++
    }
    return res.status(200).json({ message: `${importadas} avaliações importadas, ${ignoradas} ignoradas.` })
  }
}
