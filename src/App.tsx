import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Assistente from './components/Assistente'
import Home from './pages/Home'
import Unidade from './pages/Unidade'
import Avaliacao from './pages/Avaliacao'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Mapa from './pages/Mapa'
import Termos from './pages/Termos'
import { useAuthStore } from './store/authStore'

function Guard({ children }: { children: React.ReactNode }) {
  return useAuthStore(s => s.isAuthenticated()) ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/unidade/:id" element={<Unidade />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/avaliar/:id" element={<Guard><Avaliacao /></Guard>} />
            <Route path="/admin"       element={<Guard><Admin /></Guard>} />
            <Route path="/mapa"        element={<Mapa />} />
            <Route path="/termos"      element={<Termos />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Assistente />
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100 space-x-3">
          <span>Saúde Manaus — Transparência na saúde pública</span>
          <span>·</span>
          <Link to="/termos" className="hover:text-blue-600 underline underline-offset-2">Termos de Uso</Link>
        </footer>
      </div>
    </BrowserRouter>
  )
}
