import { useState, useEffect } from 'react'

const STATUS_LABEL = {
  idle:      'Sin comando activo',
  pending:   'Enviado, esperando al vehículo...',
  executing: 'En ejecución...',
  done:      'Completado',
}

const STATUS_COLOR = {
  idle:      'text-gray-400 dark:text-gray-500',
  pending:   'text-amber-500',
  executing: 'text-blue-400',
  done:      'text-green-400',
}

async function postCommand(payload) {
  const res = await fetch('http://localhost:8000/control/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Error al enviar comando')
  }
  return res.json()
}

/**
 * Panel de control del vehículo.
 * Permite enviar comandos de ascenso, descenso, mantener profundidad y detener.
 * Muestra el estado del último comando mientras el ESP32 lo procesa.
 */
export default function VehicleControls({ mockMode = false }) {
  const [targetDepth, setTargetDepth] = useState('')
  const [status, setStatus]           = useState({ action: 'none', status: 'idle' })
  const [error, setError]             = useState(null)

  // Polling de estado — solo cuando hay conexión real (no simulación)
  useEffect(() => {
    if (mockMode) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8000/control/status')
        if (res.ok) setStatus(await res.json())
      } catch {
        // silencioso — si el backend no está disponible el telemetry ya lo indica
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [mockMode])

  async function send(payload) {
    setError(null)
    try {
      const result = await postCommand(payload)
      setStatus(result)
    } catch (e) {
      setError(e.message)
    }
  }

  function handleAscender()  { send({ action: 'surface', speed_rpm: 10 }) }
  function handleDescender() { send({ action: 'dive',    speed_rpm: 10 }) }
  function handleDetener()   { send({ action: 'stop',    speed_rpm: 10 }) }

  function handleMantener() {
    const depth = parseFloat(targetDepth)
    if (isNaN(depth) || depth < 0) {
      setError('Ingresa una profundidad válida (≥ 0 m)')
      return
    }
    send({ action: 'hold', target_depth_m: depth, speed_rpm: 10 })
  }

  const commandBusy = status.status === 'pending' || status.status === 'executing'
  const disabled    = mockMode || commandBusy

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Control del Vehículo
      </p>

      {/* Botones principales */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleAscender}
          disabled={disabled}
          className="flex-1 min-w-[90px] px-4 py-2 rounded-md text-sm font-medium
            bg-sky-600 hover:bg-sky-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↑ Ascender
        </button>

        <button
          onClick={handleDescender}
          disabled={disabled}
          className="flex-1 min-w-[90px] px-4 py-2 rounded-md text-sm font-medium
            bg-indigo-600 hover:bg-indigo-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↓ Descender
        </button>

        <button
          onClick={handleDetener}
          disabled={mockMode || !commandBusy}
          className="px-4 py-2 rounded-md text-sm font-medium
            bg-red-700 hover:bg-red-600 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ■ Detener
        </button>
      </div>

      {/* Mantener profundidad */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Mantener a
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="0.00"
          value={targetDepth}
          onChange={e => setTargetDepth(e.target.value)}
          className="w-24 px-2 py-1.5 rounded-md text-sm text-right
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-200
            border border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label className="text-xs text-gray-500 dark:text-gray-400">m</label>
        <button
          onClick={handleMantener}
          disabled={disabled}
          className="px-4 py-1.5 rounded-md text-sm font-medium
            bg-emerald-700 hover:bg-emerald-600 text-white
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Mantener
        </button>
      </div>

      {/* Estado del comando */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400 dark:text-gray-500">Estado:</span>
        <span className={STATUS_COLOR[status.status]}>
          {STATUS_LABEL[status.status]}
        </span>
        {status.action !== 'none' && status.status !== 'idle' && (
          <span className="text-gray-500 dark:text-gray-600">
            ({status.action}
            {status.target_depth_m != null ? ` → ${status.target_depth_m} m` : ''})
          </span>
        )}
      </div>

      {/* Aviso modo simulación */}
      {mockMode && (
        <p className="text-xs text-amber-500">
          Modo simulación activo — conecta el vehículo para enviar comandos.
        </p>
      )}

      {/* Error */}
      {!mockMode && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
