import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Unidade, TIPO_UNIDADE_COLOR, TIPO_UNIDADE_LABEL } from '../types'

// Cores por tipo para os marcadores
const MARKER_COLOR: Record<string, string> = {
  HOSPITAL: '#ef4444',
  UPA:      '#f97316',
  SPA:      '#3b82f6',
  UFS:      '#16a34a',
  POLICLINICA: '#9333ea',
}

function scoreColor(score: number) {
  if (score <= 0)  return '#9ca3af'
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#ca8a04'
  if (score >= 40) return '#ea580c'
  return '#dc2626'
}

function createMarkerSvg(color: string, scoreColor: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <ellipse cx="16" cy="38" rx="6" ry="2.5" fill="rgba(0,0,0,0.2)"/>
      <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 26 12 26S28 21 28 12C28 5.37 22.63 0 16 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="16" cy="12" r="6" fill="${scoreColor}" stroke="white" stroke-width="1.5"/>
    </svg>
  `
}

export default function Mapa() {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const navigate  = useNavigate()

  const { data: unidades = [] } = useQuery<Unidade[]>({
    queryKey: ['unidades-todas'],
    queryFn: () => api.get('/unidades').then(r => r.data),
  })

  useEffect(() => {
    if (!mapRef.current || unidades.length === 0) return

    // Importa Leaflet dinamicamente para evitar SSR issues
    import('leaflet').then(L => {
      // Evita inicializar duas vezes
      if (leafletRef.current) {
        leafletRef.current.remove()
      }

      const map = L.map(mapRef.current!, {
        center: [-3.1019, -60.0250],
        zoom: 12,
        zoomControl: true,
      })

      leafletRef.current = map

      // Tiles OpenStreetMap — gratuito, sem API key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Plota cada unidade
      unidades.forEach(u => {
        if (!u.lat || !u.lng) return

        const mColor = MARKER_COLOR[u.tipo] || '#6b7280'
        const sColor = scoreColor(u.scoreGeral)

        const icon = L.divIcon({
          html: createMarkerSvg(mColor, sColor),
          className: '',
          iconSize:   [32, 40],
          iconAnchor: [16, 40],
          popupAnchor:[0, -42],
        })

        const scoreText = u.scoreGeral > 0
          ? `<span style="background:${sColor};color:white;padding:2px 8px;border-radius:12px;font-weight:600;">${u.scoreGeral.toFixed(1)}</span>`
          : `<span style="color:#9ca3af;font-size:12px;">Sem avaliações</span>`

        const popup = L.popup({ maxWidth: 240 }).setContent(`
          <div style="font-family:sans-serif;min-width:180px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="background:${mColor};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">
                ${TIPO_UNIDADE_LABEL[u.tipo]}
              </span>
              <span style="color:#6b7280;font-size:11px;">${u.zona}</span>
            </div>
            <p style="font-weight:700;margin:0 0 4px;font-size:14px;color:#111;">${u.nome}</p>
            <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">${u.bairro}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:12px;color:#374151;">Score geral:</span>
              ${scoreText}
            </div>
            <button
              onclick="window._goToUnidade('${u.id}')"
              style="margin-top:10px;width:100%;background:#2563eb;color:white;border:none;padding:6px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">
              Ver detalhes →
            </button>
          </div>
        `)

        L.marker([u.lat, u.lng], { icon }).addTo(map).bindPopup(popup)
      })

      // Função global para navegação ao clicar no popup
      ;(window as any)._goToUnidade = (id: string) => navigate(`/unidade/${id}`)
    })

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, [unidades])

  const comScore = unidades.filter(u => u.scoreGeral > 0).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de Saúde de Manaus</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unidades.length} unidades cadastradas · {comScore} com score
          </p>
        </div>
        {/* Legenda */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Hospital
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />UPA
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />SPA
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />UFS
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />Policlínica
          </div>
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />Bom
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-600 inline-block" />Regular
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />Crítico
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />Sem dados
          </div>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden shadow-md border border-gray-200"
        style={{ height: '70vh', minHeight: 400 }}
      />
    </div>
  )
}
