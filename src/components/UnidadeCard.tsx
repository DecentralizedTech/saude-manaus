import { Link } from 'react-router-dom'
import { Unidade, TIPO_UNIDADE_LABEL, TIPO_UNIDADE_COLOR } from '../types'
import ScoreBadge from './ScoreBadge'

export default function UnidadeCard({ u }: { u: Unidade }) {
  return (
    <Link to={`/unidade/${u.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${TIPO_UNIDADE_COLOR[u.tipo]}`}>{TIPO_UNIDADE_LABEL[u.tipo]}</span>
            {u.particular
              ? <span className="badge bg-purple-100 text-purple-700">Particular</span>
              : <span className="badge bg-gray-100 text-gray-500">Público</span>
            }
            <span className="text-xs text-gray-400">{u.zona}</span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{u.nome}</h3>
          <p className="text-sm text-gray-500 truncate">{u.bairro}</p>
        </div>
        <div className="text-right shrink-0">
          <ScoreBadge score={u.scoreGeral} />
          <p className="text-xs text-gray-400 mt-1">
            {u.totalAvaliacoes > 0
              ? `${u.totalAvaliacoes} avaliação(ões)`
              : 'Sem avaliações'}
          </p>
        </div>
      </div>
    </Link>
  )
}
