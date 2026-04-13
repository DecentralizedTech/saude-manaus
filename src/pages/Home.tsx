import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Unidade, TipoUnidade, TIPO_UNIDADE_LABEL, TIPO_UNIDADE_COLOR } from '../types'
import UnidadeCard from '../components/UnidadeCard'
import ScoreBadge from '../components/ScoreBadge'

const ZONAS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro-Sul', 'Centro-Oeste']

function RankingItem({ u, posicao, tipo }: { u: Unidade; posicao: number; tipo: 'melhor' | 'pior' }) {
  const medalha = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `${posicao}º`
  return (
    <Link to={`/unidade/${u.id}`}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
        tipo === 'melhor' ? 'bg-green-50 border-green-100 hover:border-green-300' : 'bg-red-50 border-red-100 hover:border-red-300'
      }`}>
      <span className="text-xl w-8 text-center shrink-0">{medalha}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{u.nome}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`badge text-xs ${TIPO_UNIDADE_COLOR[u.tipo]}`}>{TIPO_UNIDADE_LABEL[u.tipo]}</span>
          <span className="text-xs text-gray-400">{u.bairro}</span>
        </div>
      </div>
      <ScoreBadge score={u.scoreGeral} size="sm" />
    </Link>
  )
}

export default function Home() {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo]   = useState<TipoUnidade | ''>('')
  const [zona, setZona]   = useState('')
  const [rede, setRede]   = useState<'todos' | 'publico' | 'particular'>('todos')

  const { data: todasUnidades = [] } = useQuery<Unidade[]>({
    queryKey: ['unidades-todas'],
    queryFn: () => api.get('/unidades').then(r => r.data),
  })

  const { data: todasFiltradas = [], isLoading } = useQuery<Unidade[]>({
    queryKey: ['unidades', busca, tipo, zona],
    queryFn: () => api.get('/unidades', { params: { busca: busca || undefined, tipo: tipo || undefined, zona: zona || undefined } }).then(r => r.data),
  })

  const unidades = todasFiltradas.filter(u => {
    if (rede === 'publico')    return !u.particular
    if (rede === 'particular') return !!u.particular
    return true
  })

  // Apenas unidades com avaliações suficientes para o ranking
  const comScore = todasUnidades.filter(u => u.totalAvaliacoes >= 1 && u.scoreGeral > 0)
  const top5 = [...comScore].sort((a, b) => b.scoreGeral - a.scoreGeral).slice(0, 5)
  const pior5 = [...comScore].sort((a, b) => a.scoreGeral - b.scoreGeral).slice(0, 5)
  const temRanking = comScore.length >= 2

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Avalie as unidades de saúde de Manaus</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-sm">
          Transparência para pacientes. Avalie hospitais, UPAs e SPAs com critérios objetivos.
        </p>
      </div>

      {/* Ranking Top 5 */}
      {temRanking ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Melhores */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏆</span>
              <h2 className="font-bold text-gray-900">Top 5 Melhores</h2>
            </div>
            <div className="space-y-2">
              {top5.map((u, i) => <RankingItem key={u.id} u={u} posicao={i + 1} tipo="melhor" />)}
            </div>
          </div>

          {/* Piores */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚠️</span>
              <h2 className="font-bold text-gray-900">Top 5 Críticos</h2>
            </div>
            <div className="space-y-2">
              {pior5.map((u, i) => <RankingItem key={u.id} u={u} posicao={i + 1} tipo="pior" />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-8 text-center py-6 border-dashed border-2 border-gray-200">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-gray-500 text-sm font-medium">O ranking aparecerá quando as unidades tiverem pelo menos 1 avaliação.</p>
          <p className="text-gray-400 text-xs mt-1">Seja um dos primeiros a avaliar!</p>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input flex-1" placeholder="Buscar por nome ou bairro..." value={busca} onChange={e => setBusca(e.target.value)} />
          <select className="input sm:w-40" value={tipo} onChange={e => setTipo(e.target.value as TipoUnidade | '')}>
            <option value="">Todos os tipos</option>
            {(Object.keys(TIPO_UNIDADE_LABEL) as TipoUnidade[]).map(t => <option key={t} value={t}>{TIPO_UNIDADE_LABEL[t]}</option>)}
          </select>
          <select className="input sm:w-40" value={zona} onChange={e => setZona(e.target.value)}>
            <option value="">Todas as zonas</option>
            {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <select className="input sm:w-40" value={rede} onChange={e => setRede(e.target.value as any)}>
            <option value="todos">Pública e particular</option>
            <option value="publico">Só pública</option>
            <option value="particular">Só particular</option>
          </select>
        </div>
      </div>

      {/* Listagem */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-50" />)}
        </div>
      ) : unidades.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p>Nenhuma unidade encontrada.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-3">{unidades.length} unidade(s)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unidades.map(u => <UnidadeCard key={u.id} u={u} />)}
          </div>
        </>
      )}
    </div>
  )
}
