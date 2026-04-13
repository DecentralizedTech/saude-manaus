import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Unidade, TipoUnidade, TIPO_UNIDADE_LABEL } from '../types'
import { useAuthStore } from '../store/authStore'
import ScoreBadge from '../components/ScoreBadge'

type Form = {
  nome: string; tipo: TipoUnidade; endereco: string
  bairro: string; zona: string; telefone: string
  particular: boolean; lat: number | null; lng: number | null
}
type Aba = 'unidades' | 'avaliacoes'

const EMPTY: Form = {
  nome: '', tipo: 'HOSPITAL', endereco: '', bairro: '',
  zona: '', telefone: '', particular: false, lat: null, lng: null
}
const ZONAS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro-Sul', 'Centro-Oeste']

const TIPO_ATEND_LABEL: Record<string, string> = {
  EMERGENCIA_URGENCIA: 'Emergência / Urgência', CONSULTA_ELETIVA: 'Consulta Eletiva',
  INTERNACAO: 'Internação', EXAMES_PROCEDIMENTOS: 'Exames e Procedimentos',
}

// Mapa interativo para selecionar coordenadas
function MapaPicker({ lat, lng, onChange }: {
  lat: number | null; lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const leafRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      if (leafRef.current) return
      const map = L.map(mapRef.current!, {
        center: [lat ?? -3.1019, lng ?? -60.0250],
        zoom: 13,
        zoomControl: true,
      })
      leafRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Marcador inicial se já tiver coordenadas
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          onChange(pos.lat, pos.lng)
        })
      }

      // Clique no mapa coloca/move o marcador
      map.on('click', (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng])
        } else {
          markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', (ev: any) => {
            const pos = ev.target.getLatLng()
            onChange(pos.lat, pos.lng)
          })
        }
        onChange(newLat, newLng)
      })
    })

    return () => {
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; markerRef.current = null }
    }
  }, [])

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase">
        Localização no Mapa
        <span className="normal-case font-normal text-gray-400 ml-1">(clique para posicionar)</span>
      </label>
      <div ref={mapRef} className="mt-1 rounded-lg overflow-hidden border border-gray-300" style={{ height: 220 }} />
      {lat && lng ? (
        <p className="text-xs text-green-600 mt-1">
          ✓ Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">Clique no mapa para definir a localização</p>
      )}
    </div>
  )
}

export default function Admin() {
  const { usuario } = useAuthStore()
  const navigate    = useNavigate()
  const qc          = useQueryClient()

  const [modal, setModal]       = useState<'create' | 'edit' | null>(null)
  const [editando, setEditando] = useState<Unidade | null>(null)
  const [form, setForm]         = useState<Form>(EMPTY)
  const [busca, setBusca]       = useState('')
  const [aba, setAba]           = useState<Aba>('unidades')
  const [unidadeSel, setUnidadeSel] = useState<string>('')

  if (!usuario?.isAdmin) { navigate('/'); return null }

  const { data: unidades = [], isLoading } = useQuery<Unidade[]>({
    queryKey: ['unidades-admin'],
    queryFn: () => api.get('/unidades').then(r => r.data),
  })

  const inv = () => qc.invalidateQueries({ queryKey: ['unidades-admin'] })

  const createM = useMutation({
    mutationFn: (d: Form) => api.post('/unidades', d),
    onSuccess: () => { inv(); setModal(null) }
  })
  const updateM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<Form> }) => api.put(`/unidades?id=${id}`, d),
    onSuccess: () => { inv(); setModal(null) }
  })
  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/unidades?id=${id}`),
    onSuccess: inv
  })

  const { data: avaliacoesRaw = [], isLoading: loadingAv } = useQuery<any[]>({
    queryKey: ['avaliacoes-raw', unidadeSel],
    queryFn: () => unidadeSel
      ? api.get(`/avaliacoes?unidadeId=${unidadeSel}&raw=true`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!unidadeSel,
  })

  const deleteAvM = useMutation({
    mutationFn: ({ id, unidadeId }: { id: string; unidadeId: string }) =>
      api.delete(`/avaliacoes?id=${id}&unidadeId=${unidadeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avaliacoes-raw', unidadeSel] }),
  })

  const openCreate = () => { setForm(EMPTY); setEditando(null); setModal('create') }
  const openEdit   = (u: Unidade) => {
    setForm({
      nome: u.nome, tipo: u.tipo, endereco: u.endereco,
      bairro: u.bairro, zona: u.zona, telefone: u.telefone || '',
      particular: !!u.particular,
      lat: u.lat ? Number(u.lat) : null,
      lng: u.lng ? Number(u.lng) : null,
    })
    setEditando(u); setModal('edit')
  }

  const handleSave = () => {
    if (modal === 'create') createM.mutate(form)
    else if (editando)      updateM.mutate({ id: editando.id, d: form })
  }

  const f = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const exportarCSV = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/exportar', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { alert('Erro ao exportar'); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `avaliacoes-saude-manaus-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtradas = unidades.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) || u.bairro.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-sm text-gray-400">Gerenciar unidades de saúde</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="btn-secondary flex items-center gap-2">
            📥 Exportar CSV
          </button>
          <button onClick={openCreate} className="btn-primary">+ Nova unidade</button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['unidades', 'avaliacoes'] as Aba[]).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${aba === a ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {a === 'unidades' ? '🏥 Unidades' : '📋 Avaliações'}
          </button>
        ))}
      </div>

      {aba === 'avaliacoes' && (
        <div>
          <div className="flex gap-3 mb-4 items-center">
            <select className="input flex-1" value={unidadeSel} onChange={e => setUnidadeSel(e.target.value)}>
              <option value="">Selecione uma unidade...</option>
              {unidades.sort((a,b) => a.nome.localeCompare(b.nome)).map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>

          {unidadeSel && (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Data', 'Tipo de Atendimento', 'Score', 'Usuário', 'Ação'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {avaliacoesRaw.length === 0
                    ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma avaliação encontrada</td></tr>
                    : avaliacoesRaw.map((av: any) => (
                      <tr key={av.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {av.createdAt ? new Date(av.createdAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {TIPO_ATEND_LABEL[av.tipoAtendimento] || av.tipoAtendimento}
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBadge score={Number(av.score)} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {av.usuarioId?.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => confirm('Remover esta avaliação? O score será recalculado.') && deleteAvM.mutate({ id: av.id, unidadeId: unidadeSel })}
                            className="text-red-500 hover:underline text-xs">
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {avaliacoesRaw.length > 0 && (
                <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
                  {avaliacoesRaw.length} avaliação(ões) — o score é recalculado automaticamente após remoção
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {aba === 'unidades' && (<>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(['HOSPITAL','UPA','SPA','UFS'] as TipoUnidade[]).map(t => (
          <div key={t} className="card text-center py-3">
            <p className="text-2xl font-bold">{unidades.filter(u => u.tipo === t).length}</p>
            <p className="text-xs text-gray-500">{TIPO_UNIDADE_LABEL[t]}s</p>
          </div>
        ))}
        <div className="card text-center py-3">
          <p className="text-2xl font-bold">{unidades.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>

      <input className="input mb-3" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Nome','Tipo','Rede','Bairro','Zona','Score','Aval.','Mapa','Ações'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? <tr><td colSpan={9} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : filtradas.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{u.nome}</td>
                  <td className="px-4 py-3"><span className="badge bg-blue-50 text-blue-700">{TIPO_UNIDADE_LABEL[u.tipo]}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.particular ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.particular ? 'Particular' : 'Público'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.bairro}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.zona}</td>
                  <td className="px-4 py-3"><ScoreBadge score={u.scoreGeral} size="sm" /></td>
                  <td className="px-4 py-3 text-gray-500">{u.totalAvaliacoes}</td>
                  <td className="px-4 py-3 text-center">
                    {u.lat && u.lng
                      ? <span title={`${Number(u.lat).toFixed(4)}, ${Number(u.lng).toFixed(4)}`}>📍</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">Editar</button>
                      <button onClick={() => confirm('Desativar?') && deleteM.mutate(u.id)} className="text-red-500 hover:underline text-xs">Desativar</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-auto">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Nova unidade' : 'Editar unidade'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
                <input className="input mt-1" value={form.nome} onChange={f('nome')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                  <select className="input mt-1" value={form.tipo} onChange={f('tipo')}>
                    {(Object.keys(TIPO_UNIDADE_LABEL) as TipoUnidade[]).map(t => <option key={t} value={t}>{TIPO_UNIDADE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Zona</label>
                  <select className="input mt-1" value={form.zona} onChange={f('zona')}>
                    <option value="">Selecione</option>
                    {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Endereço</label>
                <input className="input mt-1" value={form.endereco} onChange={f('endereco')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Bairro</label>
                  <input className="input mt-1" value={form.bairro} onChange={f('bairro')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Telefone</label>
                  <input className="input mt-1" value={form.telefone} onChange={f('telefone')} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="particular" checked={form.particular}
                  onChange={e => setForm(prev => ({ ...prev, particular: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="particular" className="text-sm text-gray-700">Hospital particular</label>
              </div>

              {/* Mapa interativo */}
              <MapaPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => setForm(prev => ({ ...prev, lat, lng }))}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={!form.nome || !form.endereco || !form.bairro || !form.zona || createM.isPending || updateM.isPending}
                className="btn-primary flex-1"
              >
                {createM.isPending || updateM.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
