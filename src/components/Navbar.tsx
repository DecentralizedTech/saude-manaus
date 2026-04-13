import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { usuario, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
          <span>🏥</span><span>Saúde Manaus</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/mapa" className="text-sm text-gray-600 hover:text-blue-700 font-medium hidden sm:block">🗺️ Mapa</Link>
          <a href="https://paineldenoticiasadversas.vercel.app/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-700 font-medium hidden sm:block">
            📰 Painel de Eventos Adversos
          </a>
          {isAuthenticated() ? (
            <>
              {usuario?.isAdmin && (
                <Link to="/admin" className="text-sm text-gray-600 hover:text-blue-700 font-medium">Admin</Link>
              )}
              {usuario?.avatar
                ? <img src={usuario.avatar} className="w-8 h-8 rounded-full" alt={usuario.nome} />
                : <span className="text-sm text-gray-600 hidden sm:block">{usuario?.nome}</span>
              }
              <button onClick={() => { logout(); navigate('/') }} className="btn-secondary text-sm py-1.5">Sair</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-1.5">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
