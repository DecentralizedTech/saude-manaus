import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { Unidade, TipoAtendimento, TIPO_ATENDIMENTO_LABEL } from '../types'

type Pergunta = { key: string; label: string; tipo: 'bool' | 'tempo' }

const PERGUNTAS: Record<TipoAtendimento, Pergunta[]> = {
  EMERGENCIA_URGENCIA: [
    { key: 'diagnostico_escrito',   label: 'Recebeu diagnóstico ou orientação por escrito?',   tipo: 'bool' },
    { key: 'falta_materiais',       label: 'Havia falta de materiais básicos?',                  tipo: 'bool' },
    { key: 'tempo_espera',          label: 'Tempo de espera até o primeiro atendimento (min)',   tipo: 'tempo' },
    { key: 'passou_triagem',        label: 'Passou por triagem?',                                tipo: 'bool' },
    { key: 'macas_suficientes',     label: 'Havia macas suficientes?',                           tipo: 'bool' },
    { key: 'retornou_48h',          label: 'Precisou retornar pelo mesmo problema em 48h?',      tipo: 'bool' },
    { key: 'limpeza_visivel',       label: 'Limpeza visível nas instalações?',                   tipo: 'bool' },
    { key: 'banheiros_funcionando', label: 'Banheiros funcionando?',                             tipo: 'bool' },
  ],
  CONSULTA_ELETIVA: [
    { key: 'prescricao_escrita',    label: 'Recebeu prescrição ou orientação por escrito?',      tipo: 'bool' },
    { key: 'horario_agendado',      label: 'A consulta aconteceu no horário agendado?',          tipo: 'bool' },
    { key: 'falta_materiais',       label: 'Havia falta de materiais básicos?',                  tipo: 'bool' },
    { key: 'passou_triagem',        label: 'Passou por triagem?',                                tipo: 'bool' },
    { key: 'limpeza_visivel',       label: 'Limpeza visível nas instalações?',                   tipo: 'bool' },
    { key: 'banheiros_funcionando', label: 'Banheiros funcionando?',                             tipo: 'bool' },
  ],
  INTERNACAO: [
    { key: 'plano_tratamento_escrito', label: 'Informado sobre plano de tratamento por escrito?', tipo: 'bool' },
    { key: 'leito_disponivel',         label: 'Havia leito disponível?',                          tipo: 'bool' },
    { key: 'falta_materiais',          label: 'Havia falta de materiais básicos?',                tipo: 'bool' },
    { key: 'passou_triagem',           label: 'Passou por triagem?',                              tipo: 'bool' },
    { key: 'limpeza_visivel',          label: 'Limpeza visível nas instalações?',                 tipo: 'bool' },
    { key: 'banheiros_funcionando',    label: 'Banheiros funcionando?',                           tipo: 'bool' },
  ],
  EXAMES_PROCEDIMENTOS: [
    { key: 'resultado_prazo',              label: 'Resultado entregue no prazo?',                        tipo: 'bool' },
    { key: 'orientacao_resultado_escrita', label: 'Recebeu orientação sobre o resultado por escrito?',   tipo: 'bool' },
    { key: 'exame_prazo',                  label: 'Exame realizado no prazo informado?',                 tipo: 'bool' },
    { key: 'falta_materiais',              label: 'Havia falta de materiais básicos?',                   tipo: 'bool' },
    { key: 'precisou_remarcar',            label: 'Precisou remarcar o exame?',                          tipo: 'bool' },
  ],
}

type Respostas = Record<string, boolean | number>

export default function AvaliacaoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tipo, setTipo]         = useState<TipoAtendimento | ''>('')
  const [respostas, setRespostas] = useState<Respostas>({})
  const [erro, setErro]           = useState('')

  const { data: unidade } = useQuery<Unidade>({
    queryKey: ['unidade', id],
    queryFn: () => api.get(`/unidades?id=${id}`).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (body: object) => api.post('/avaliacoes', body),
    onSuccess: (res) => navigate(`/unidade/${id}?score=${res.data.score}`),
    onError: (err: any) => setErro(err.response?.data?.error || 'Erro ao enviar avaliação.'),
  })

  const perguntas = tipo ? PERGUNTAS[tipo] : []
  const completo  = perguntas.length > 0 && perguntas.every(p => respostas[p.key] !== undefined)

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Avaliar unidade</h1>
        {unidade && <p className="text-gray-500 text-sm mt-1">{unidade.nome}</p>}
      </div>

      {/* Tipo de atendimento */}
      <div className="card mb-4">
        <p className="font-medium text-gray-700 mb-3 text-sm">Qual foi o tipo de atendimento?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(TIPO_ATENDIMENTO_LABEL) as TipoAtendimento[]).map(t => (
            <button key={t} type="button"
              onClick={() => { setTipo(t); setRespostas({}) }}
              className={`p-3 rounded-lg text-sm font-medium border text-left transition-colors ${
                tipo === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {TIPO_ATENDIMENTO_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Perguntas */}
      {tipo && (
        <div className="card space-y-3 mb-4">
          {perguntas.map(p => (
            p.tipo === 'bool' ? (
              <div key={p.key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">{p.label}</p>
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button"
                      onClick={() => setRespostas(prev => ({ ...prev, [p.key]: v }))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        respostas[p.key] === v
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {v ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div key={p.key} className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 block mb-2">{p.label}</label>
                <input type="number" min={0} max={600} placeholder="ex: 30" className="input w-28"
                  value={respostas[p.key] !== undefined ? String(respostas[p.key]) : ''}
                  onChange={e => setRespostas(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                />
              </div>
            )
          ))}
        </div>
      )}

      {erro && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erro}</div>}

      <div className="flex gap-3">
        <button onClick={() => navigate(`/unidade/${id}`)} className="btn-secondary">Cancelar</button>
        <button
          onClick={() => mutation.mutate({ unidadeId: id, tipoAtendimento: tipo, respostas })}
          disabled={!completo || mutation.isPending}
          className="btn-primary flex-1"
        >
          {mutation.isPending ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
      {tipo && !completo && (
        <p className="text-xs text-gray-400 mt-2 text-center">Responda todas as perguntas para enviar.</p>
      )}
    </div>
  )
}
