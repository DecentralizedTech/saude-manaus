import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, config: object) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export default function Login() {
  const navigate      = useNavigate()
  const { loginWithGoogle } = useAuthStore()
  const buttonRef     = useRef<HTMLDivElement>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setErro('VITE_GOOGLE_CLIENT_ID não configurado.')
      return
    }

    const initButton = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        use_fedcm_for_prompt: true,
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
        locale: 'pt-BR',
      })
    }

    // Se o script já carregou, inicializa direto; senão aguarda
    if (window.google) {
      initButton()
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); initButton() }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  const handleCredential = async (response: { credential: string }) => {
    setCarregando(true)
    setErro('')
    try {
      await loginWithGoogle(response.credential)
      navigate('/')
    } catch (e: any) {
      setErro(e?.response?.data?.error || 'Erro ao fazer login. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🏥</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Entrar no Saúde Manaus</h1>
        <p className="text-sm text-gray-500 mb-6">
          Use sua conta Google para avaliar unidades de saúde de Manaus.
        </p>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Entrando...
          </div>
        ) : (
          <div className="flex justify-center">
            <div ref={buttonRef} />
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Ao entrar, você concorda com nossos{' '}
          <a href="/termos" className="underline hover:text-blue-600">Termos de Uso</a>.
          Suas avaliações são de sua responsabilidade.
        </p>
      </div>
    </div>
  )
}
