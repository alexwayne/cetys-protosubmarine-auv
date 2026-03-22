import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const CHARTS = [
  { key: 'buoyancy_force_n', label: 'Fuerza de Flotabilidad', unit: 'N',     color: '#60a5fa' },
  { key: 'depth_m',          label: 'Profundidad',            unit: 'm',     color: '#34d399' },
  { key: 'motor_steps',      label: 'Posición del Motor',     unit: 'pasos', color: '#f59e0b' },
  { key: 'accel_z',          label: 'Acel. Z',                unit: 'm/s²',  color: '#f472b6' },
]

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function SingleChart({ config, data, darkMode }) {
  const axisColor  = darkMode ? '#6b7280' : '#9ca3af'
  const gridColor  = darkMode ? '#374151' : '#e5e7eb'
  const tooltipBg  = darkMode ? '#1f2937' : '#ffffff'
  const tooltipClr = darkMode ? '#f3f4f6' : '#111827'

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
        {config.label}{' '}
        <span className="text-gray-400 dark:text-gray-600">({config.unit})</span>
      </p>
      <ResponsiveContainer width="100%" height={115}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: axisColor, fontSize: 10 }}
            tickLine={false}
            width={52}
            tickFormatter={v => `${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: 'none',
              borderRadius: '6px',
              color: tooltipClr,
              fontSize: '12px',
            }}
            formatter={v => [`${v} ${config.unit}`, config.label]}
            labelFormatter={formatTimestamp}
          />
          <Line
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function TelemetryChart({ readings, darkMode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CHARTS.map(config => (
        <SingleChart
          key={config.key}
          config={config}
          data={readings}
          darkMode={darkMode}
        />
      ))}
    </div>
  )
}
