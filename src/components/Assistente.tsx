import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

interface Msg { role: 'user' | 'assistant'; content: string }

// Converte markdown simples para HTML legível
function renderMd(text: string) {
  const html = text
    // Tabelas markdown: | col | col | -> <table>
    .replace(/(\|.+\|\n?)+/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim() && !r.match(/^\|[-| ]+\|$/))
      if (rows.length === 0) return match
      const tableRows = rows.map((row, i) => {
        const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        const tag = i === 0 ? 'th' : 'td'
        return `<tr>${cells.map(c => `<${tag} style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left">${c.trim()}</${tag}>`).join('')}</tr>`
      }).join('')
      return `<table style="border-collapse:collapse;font-size:12px;margin:6px 0;width:100%">${tableRows}</table>`
    })
    // Negrito **texto**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Itálico *texto*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Títulos ## e ###
    .replace(/^### (.+)$/gm, '<p style="font-weight:700;font-size:13px;margin:8px 0 2px">$1</p>')
    .replace(/^## (.+)$/gm, '<p style="font-weight:700;font-size:14px;margin:8px 0 2px">$1</p>')
    // Listas - item
    .replace(/^[-*] (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:4px 0;padding-left:16px">${m}</ul>`)
    // Separadores ---
    .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:6px 0"/>')
    // Quebras de linha duplas
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')

  return html
}

export default function Assistente() {
  const [aberto, setAberto]     = useState(false)
  const [msgs, setMsgs]         = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return
    setInput('')
    const novas: Msg[] = [...msgs, { role: 'user', content: texto }]
    setMsgs(novas)
    setLoading(true)
    try {
      const historico = novas.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const { data } = await api.post('/assistente', { mensagem: texto, historico })
      setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta }])
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Não foi possível processar sua mensagem. Tente novamente em breve.'
      setMsgs(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-2xl"
        title="Assistente Saúde Manaus"
      >
        {aberto ? '✕' : '🤖'}
      </button>

      {/* Janela do chat */}
      {aberto && (
        <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: 480 }}>
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2 shrink-0">
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-semibold text-sm">Assistente Saúde Manaus</p>
              <p className="text-xs text-blue-200">Pergunte sobre hospitais, UPAs e SPAs</p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {msgs.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                <p className="text-3xl mb-2">💬</p>
                <p>Olá! Posso ajudar você a encontrar a melhor unidade de saúde em Manaus.</p>
                <div className="mt-3 space-y-1">
                  {['Qual hospital tem melhor score?', 'Tem UPA na Zona Norte?', 'Qual o telefone do HPS 28 de Agosto?'].map(s => (
                    <button key={s} onClick={() => { setInput(s); }} className="block w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-400 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                }`}>
                  {m.role === 'assistant'
                    ? <span dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                    : m.content
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0 flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              disabled={loading}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
