import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  LineChart, Line, Legend,
} from 'recharts'
import api from '../lib/api'
import { Unidade, EstatisticasUnidade, TIPO_UNIDADE_LABEL, TIPO_UNIDADE_COLOR } from '../types'
import ScoreBadge from '../components/ScoreBadge'
import { useAuthStore } from '../store/authStore'

function barColor(pct: number) {
  if (pct >= 80) return '#16a34a'
  if (pct >= 60) return '#ca8a04'
  if (pct >= 40) return '#ea580c'
  return '#dc2626'
}

export default function UnidadePage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const [analise, setAnalise]         = useState<string | null>(null)
  const [loadingAnalise, setLoading]  = useState(false)

  const { data: unidade, isLoading } = useQuery<Unidade>({
    queryKey: ['unidade', id],
    queryFn: () => api.get(`/unidades?id=${id}`).then(r => r.data),
  })

  const { data: stats } = useQuery<EstatisticasUnidade>({
    queryKey: ['stats', id],
    queryFn: () => api.get(`/avaliacoes?unidadeId=${id}`).then(r => r.data),
  })

  const gerarAnalise = async () => {
    setLoading(true)
    setAnalise(null)
    try {
      const { data } = await api.post('/analise', { unidadeId: id })
      setAnalise(data.analise ?? 'Não há avaliações suficientes para gerar uma análise.')
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Erro ao gerar análise. Tente novamente.'
      setAnalise(`⚠️ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/2" />
      <div className="h-40 bg-gray-100 rounded" />
    </div>
  )

  if (!unidade) return <div className="text-center py-20 text-gray-400">Unidade não encontrada.</div>

  const radarData = stats?.estatisticas.map(e => ({ tipo: e.label.split(' / ')[0], score: e.media })) || []
  const barData   = (stats?.parametros || []).map(p => ({ label: p.label, valor: p.percentualPositivo }))
  const lineData  = (stats?.serieScore || []).map(p => ({ semana: p.semana.slice(5), score: p.scoreGeral }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${TIPO_UNIDADE_COLOR[unidade.tipo]}`}>{TIPO_UNIDADE_LABEL[unidade.tipo]}</span>
              <span className="badge bg-gray-100 text-gray-500">{unidade.particular ? 'Particular' : 'Público'}</span>
              <span className="text-xs text-gray-400">{unidade.zona}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{unidade.nome}</h1>
            <p className="text-gray-500 text-sm mt-1">{unidade.endereco}, {unidade.bairro}</p>
            {unidade.telefone && <p className="text-sm text-gray-400 mt-1">📞 {unidade.telefone}</p>}
          </div>
          <div className="text-center shrink-0">
            <p className="text-xs text-gray-400 mb-1">Score Geral</p>
            <ScoreBadge score={unidade.scoreGeral} size="lg" showLabel />
            <p className="text-xs text-gray-400 mt-1">
              {unidade.totalAvaliacoes >= 1
                ? `${unidade.totalAvaliacoes} avaliações`
                : `${unidade.totalAvaliacoes} avaliações (mín. 1)`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {isAuthenticated()
            ? <Link to={`/avaliar/${unidade.id}`} className="btn-primary inline-block">✍️ Avaliar</Link>
            : <Link to="/login" className="btn-secondary inline-block">Entre para avaliar</Link>
          }
          {stats && stats.totalAvaliacoes > 0 && (
            <button onClick={gerarAnalise} disabled={loadingAnalise}
              className="btn-secondary inline-flex items-center gap-2">
              {loadingAnalise ? (
                <><svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>Gerando...</>
              ) : '🤖 Análise IA'}
            </button>
          )}
        </div>

        {/* Síntese IA */}
        {analise && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700 leading-relaxed">
            <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
              🤖 Análise gerada por IA · Gemma 4
            </p>
            {analise}
          </div>
        )}
      </div>

      {stats && stats.totalAvaliacoes > 0 ? (<>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Score por Categoria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.estatisticas.map(e => (
              <div key={e.tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">{e.label}</p>
                  <p className="text-xs text-gray-400">{e.total} avaliação(ões)</p>
                </div>
                <ScoreBadge score={e.media} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {radarData.length >= 2 && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Visão Geral por Categoria</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                <Tooltip formatter={(v: number) => v.toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {barData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-1">Desempenho por Parâmetro</h2>
            <p className="text-xs text-gray-400 mb-4">% de respostas positivas por critério</p>
            <ResponsiveContainer width="100%" height={barData.length * 36 + 20}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Positivo']} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {barData.map((_e, i) => <Cell key={i} fill={barColor(barData[i].valor)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />≥80% Bom</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-600 inline-block" />60–79% Regular</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-600 inline-block" />40–59% Ruim</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />&lt;40% Crítico</span>
            </div>
          </div>
        )}

        {lineData.length >= 2 && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-1">Evolução do Score</h2>
            <p className="text-xs text-gray-400 mb-4">Score geral semanal</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}`, 'Score']} />
                <Legend />
                <Line type="monotone" dataKey="score" name="Score Geral" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </>) : (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>Nenhuma avaliação ainda. Seja o primeiro!</p>
        </div>
      )}
    </div>
  )
}
