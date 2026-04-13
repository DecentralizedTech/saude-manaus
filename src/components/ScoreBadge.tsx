interface Props { score: number; size?: 'sm' | 'md' | 'lg'; showLabel?: boolean }

function getColor(s: number) {
  if (s >= 80) return 'bg-green-100 text-green-700 border-green-200'
  if (s >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (s >= 40) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-red-100 text-red-700 border-red-200'
}
function getLabel(s: number) {
  if (s >= 80) return 'Bom'
  if (s >= 60) return 'Regular'
  if (s >= 40) return 'Ruim'
  return 'Crítico'
}
const SIZE = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-lg px-4 py-1.5 font-bold' }

export default function ScoreBadge({ score, size = 'md', showLabel = false }: Props) {
  if (!score || score === 0)
    return <span className="badge bg-gray-100 text-gray-400 border border-gray-200 text-xs">Sem dados</span>
  return (
    <span className={`badge border font-semibold ${getColor(score)} ${SIZE[size]}`}>
      {score.toFixed(1)}{showLabel && ` — ${getLabel(score)}`}
    </span>
  )
}
