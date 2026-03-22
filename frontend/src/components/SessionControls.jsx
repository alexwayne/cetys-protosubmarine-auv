import { useState } from 'react'

/**
 * Handles session start/stop and notifies the parent of the active session ID.
 * @param {{ onSessionChange: (id: number|null) => void }} props
 */
export default function SessionControls({ onSessionChange }) {
  const [label, setLabel]     = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [status, setStatus]   = useState('idle') // 'idle' | 'running' | 'error'

  async function handleStart() {
    try {
      const res = await fetch('http://localhost:8000/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || 'Sesión sin nombre' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessionId(data.id)
      onSessionChange?.(data.id)
      setStatus('running')
    } catch {
      setStatus('error')
    }
  }

  async function handleStop() {
    if (!sessionId) return
    try {
      await fetch('http://localhost:8000/sessions/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      setStatus('idle')
      onSessionChange?.(null)
      setSessionId(null)
    } catch {
      setStatus('error')
    }
  }

  const running = status === 'running'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        placeholder="Nombre de sesión..."
        value={label}
        onChange={e => setLabel(e.target.value)}
        disabled={running}
        className="px-3 py-1.5 rounded-md text-sm w-48
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-gray-200
          border border-gray-300 dark:border-gray-600
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-1 focus:ring-blue-500
          disabled:opacity-50"
      />

      <button
        onClick={handleStart}
        disabled={running}
        className="px-4 py-1.5 rounded-md text-sm font-medium
          bg-blue-600 hover:bg-blue-500 text-white
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Iniciar
      </button>

      <button
        onClick={handleStop}
        disabled={!running}
        className="px-4 py-1.5 rounded-md text-sm font-medium
          bg-red-700 hover:bg-red-600 text-white
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Detener
      </button>

      <span className="text-xs text-gray-500 dark:text-gray-400">
        {running && `Sesión #${sessionId} activa`}
        {status === 'idle' && 'Sin sesión activa'}
        {status === 'error' && (
          <span className="text-red-500">Error — verifica la conexión</span>
        )}
      </span>
    </div>
  )
}
