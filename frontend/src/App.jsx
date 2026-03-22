import { useState, useEffect } from 'react'
import { useTelemetry } from './hooks/useTelemetry'
import TelemetryChart from './components/TelemetryChart'
import SessionControls from './components/SessionControls'
import ExportButton from './components/ExportButton'
import VehicleControls from './components/VehicleControls'
import VehicleVisual from './components/VehicleVisual'

const STAT_CARDS = [
  { label: 'F_b',      unit: 'N',    get: r => r.buoyancy_force_n?.toFixed(4) ?? '—' },
  { label: 'Profund.', unit: 'm',    get: r => r.depth_m?.toFixed(2) ?? '—' },
  { label: 'Motor',    unit: 'pasos',get: r => r.motor_steps },
  { label: 'Presión',  unit: 'hPa',  get: r => (r.pressure_pa / 100).toFixed(1) },
]

export default function App() {
  const [darkMode, setDarkMode]   = useState(true)
  const [mockMode, setMockMode]   = useState(true)
  const [sessionId, setSessionId] = useState(null)

  const { readings, isConnected } = useTelemetry(mockMode)

  // Sync dark mode with the <html> class — Tailwind dark: variants depend on this
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const latest = readings.at(-1)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      {/* ── Header ── */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
            Panel Proto-AUV
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Cetys Universidad · Control de Flotabilidad
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`} />
            {mockMode ? 'Simulación' : isConnected ? 'En vivo' : 'Desconectado'}
          </span>

          {/* Mock mode toggle */}
          <button
            onClick={() => setMockMode(m => !m)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
              mockMode
                ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {mockMode ? 'Simulación ON' : 'Simulación OFF'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="px-3 py-1 rounded text-xs font-medium
              bg-gray-100 dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200
              transition-colors"
          >
            {darkMode ? '☀ Claro' : '☾ Oscuro'}
          </button>
        </div>
      </header>

      <main className="px-6 py-5 space-y-4">

        {/* ── Fila de sesión ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <SessionControls onSessionChange={setSessionId} />
          <ExportButton sessionId={sessionId} />
        </div>

        {/* ── Columna izquierda + visual a la derecha ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">

          {/* Columna izquierda: tarjetas + controles + gráficas */}
          <div className="space-y-4">

            {/* Tarjetas de valores en tiempo real */}
            {latest && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STAT_CARDS.map(({ label, unit, get }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                    <p className="text-xl font-mono font-medium text-gray-900 dark:text-white">
                      {get(latest)}{' '}
                      <span className="text-sm font-sans text-gray-400 dark:text-gray-500">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Controles del vehículo */}
            <VehicleControls mockMode={mockMode} />

            {/* Gráficas de telemetría */}
            <TelemetryChart readings={readings} darkMode={darkMode} />

          </div>

          {/* Columna derecha: visualización del vehículo */}
          <VehicleVisual
            depth_m={latest?.depth_m ?? 0}
            motor_steps={latest?.motor_steps ?? 0}
          />

        </div>

      </main>
    </div>
  )
}
