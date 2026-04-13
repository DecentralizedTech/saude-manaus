// api/_score.js

function pontosTempo(min) {
  if (min <= 15)  return 20
  if (min <= 30)  return 15
  if (min <= 60)  return 10
  if (min <= 120) return 5
  return 0
}

export function calcularScore(tipo, r) {
  switch (tipo) {
    case 'EMERGENCIA_URGENCIA': {
      let s = 0
      if (r.diagnostico_escrito === true)  s += 25
      if (r.falta_materiais    === false)  s += 20
      if (typeof r.tempo_espera === 'number') s += pontosTempo(r.tempo_espera)
      if (r.passou_triagem     === true)   s += 10
      if (r.macas_suficientes  === true)   s += 10
      if (r.retornou_48h       === false)  s += 10
      if (r.limpeza_visivel    === true)   s += 3
      if (r.banheiros_funcionando === true) s += 2
      return s
    }
    case 'CONSULTA_ELETIVA': {
      let s = 0
      if (r.prescricao_escrita === true)  s += 30
      if (r.horario_agendado   === true)  s += 25
      if (r.falta_materiais    === false) s += 20
      if (r.passou_triagem     === true)  s += 10
      if (r.limpeza_visivel    === true)  s += 10
      if (r.banheiros_funcionando === true) s += 5
      return s
    }
    case 'INTERNACAO': {
      let s = 0
      if (r.plano_tratamento_escrito === true) s += 30
      if (r.leito_disponivel         === true) s += 25
      if (r.falta_materiais          === false) s += 20
      if (r.passou_triagem           === true)  s += 10
      if (r.limpeza_visivel          === true)  s += 10
      if (r.banheiros_funcionando    === true)  s += 5
      return s
    }
    case 'EXAMES_PROCEDIMENTOS': {
      let s = 0
      if (r.resultado_prazo              === true)  s += 30
      if (r.orientacao_resultado_escrita === true)  s += 25
      if (r.exame_prazo                  === true)  s += 25
      if (r.falta_materiais              === false) s += 15
      if (r.precisou_remarcar            === false) s += 5
      return s
    }
    default: return 0
  }
}

const PESOS = {
  EMERGENCIA_URGENCIA:   0.40,
  CONSULTA_ELETIVA:      0.25,
  INTERNACAO:            0.20,
  EXAMES_PROCEDIMENTOS:  0.15,
}

export function calcularScoreGeral(mediaPorTipo) {
  let totalPeso = 0, totalPonderado = 0
  for (const [tipo, media] of Object.entries(mediaPorTipo)) {
    const peso = PESOS[tipo]
    if (!peso) continue
    totalPonderado += media * peso
    totalPeso += peso
  }
  if (totalPeso === 0) return 0
  return Math.round((totalPonderado / totalPeso) * 10) / 10
}
