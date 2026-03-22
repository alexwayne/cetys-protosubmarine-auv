// --- Constantes de calibración — actualizar cuando se tenga el dato real ---
const MAX_DEPTH_M     = 2.0    // profundidad máxima del tanque de prueba (m)
const MAX_MOTOR_STEPS = 2048   // pasos completos del 28BYJ-48 — calibrar con prototipo
// ---------------------------------------------------------------------------

// Dimensiones del SVG y distribución
const SVG_W   = 200
const SVG_H   = 480
const SCALE_W = 44   // ancho del área de escala de profundidad
const PAD_T   = 18
const PAD_B   = 18
const TANK_X  = SCALE_W + 6
const TANK_Y  = PAD_T
const TANK_W  = SVG_W - TANK_X - 14
const TANK_H  = SVG_H - PAD_T - PAD_B
const CX      = TANK_X + TANK_W / 2  // eje horizontal de la cápsula

// Dimensiones visuales de la cápsula (no a escala física real)
const CAP_R   = 20   // radio visual de cada hemisferio (px)
const MAX_GAP = 11   // apertura máxima entre hemisferios (px) ≙ h = 30 mm

const TICKS = [0, 0.5, 1.0, 1.5, 2.0]

/**
 * Visualización dinámica del prototipo AUV en un tanque de agua.
 *
 * La cápsula (dos hemisferios de r = 55 mm, PETG) se desplaza verticalmente
 * según depth_m. La separación entre hemisferios (h = 0–30 mm) se representa
 * proporcionalmente a motor_steps.
 *
 * @param {{ depth_m: number, motor_steps: number }} props
 */
export default function VehicleVisual({ depth_m = 0, motor_steps = 0 }) {
  const depth = Math.max(0, Math.min(depth_m ?? 0, MAX_DEPTH_M))
  const steps = Math.max(0, Math.min(motor_steps ?? 0, MAX_MOTOR_STEPS))

  // Apertura actual entre hemisferios en píxeles
  const gap = (steps / MAX_MOTOR_STEPS) * MAX_GAP

  // Posición vertical de la punta del domo superior (coordenadas absolutas SVG)
  // El rango de viaje deja margen para que la cápsula no salga del tanque
  const travel      = TANK_H - 2 * CAP_R - MAX_GAP
  const capsuleTopY = TANK_Y + (depth / MAX_DEPTH_M) * travel

  // Caras planas de cada hemisferio (absolutas)
  const topFaceY = capsuleTopY + CAP_R
  const botFaceY = topFaceY + gap
  const midY     = topFaceY + gap / 2   // centro de la cápsula (para indicador)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Vista del Vehículo
      </p>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-[200px] mx-auto select-none block"
        aria-label="Representación del AUV en el tanque"
      >
        {/* Relleno de agua */}
        <rect
          x={TANK_X} y={TANK_Y}
          width={TANK_W} height={TANK_H}
          fill="#0ea5e9" fillOpacity={0.1}
          rx={3}
        />

        {/* Borde del tanque */}
        <rect
          x={TANK_X} y={TANK_Y}
          width={TANK_W} height={TANK_H}
          fill="none"
          stroke="#0ea5e9" strokeOpacity={0.4} strokeWidth={1.5}
          rx={3}
        />

        {/* Línea de superficie */}
        <line
          x1={TANK_X + 4} y1={TANK_Y}
          x2={TANK_X + TANK_W - 4} y2={TANK_Y}
          stroke="#7dd3fc" strokeWidth={2.5}
        />
        <text x={TANK_X + TANK_W / 2} y={TANK_Y - 5} textAnchor="middle" fontSize={8} fill="#7dd3fc">
          superficie
        </text>

        {/* Escala de profundidad */}
        {TICKS.map(t => {
          const ty = TANK_Y + (t / MAX_DEPTH_M) * TANK_H
          return (
            <g key={t}>
              <line
                x1={TANK_X - 5} y1={ty}
                x2={TANK_X} y2={ty}
                stroke="#6b7280" strokeWidth={1}
              />
              <text
                x={TANK_X - 7} y={ty + 4}
                textAnchor="end" fontSize={9} fill="#9ca3af"
              >
                {t.toFixed(2)}m
              </text>
            </g>
          )
        })}

        {/* ── Cápsula ──────────────────────────────────────────────────── */}
        {/* El grupo se anima verticalmente con CSS transition */}
        <g style={{ transform: `translateY(${capsuleTopY}px)`, transition: 'transform 0.45s ease-out' }}>

          {/* Hemisferio superior (domo hacia arriba) */}
          {/* Cara plana en y = CAP_R (coords del grupo) */}
          <path
            d={`M ${CX - CAP_R} ${CAP_R} A ${CAP_R} ${CAP_R} 0 0 0 ${CX + CAP_R} ${CAP_R} Z`}
            fill="#0891b2"
            stroke="#22d3ee"
            strokeWidth={1.5}
          />

          {/* Mecanismo de separación (brecha entre hemisferios) */}
          <rect
            x={CX - CAP_R + 2} y={CAP_R}
            width={2 * CAP_R - 4}
            height={gap}
            fill="#083344"
            rx={1}
          />
          {/* Líneas decorativas del mecanismo */}
          {gap > 2 && (
            <>
              <line
                x1={CX - CAP_R + 4} y1={CAP_R + gap / 2}
                x2={CX + CAP_R - 4} y2={CAP_R + gap / 2}
                stroke="#0e7490" strokeWidth={1} strokeDasharray="3 2"
              />
            </>
          )}

          {/* Hemisferio inferior (domo hacia abajo) */}
          {/* Cara plana en y = CAP_R + gap (coords del grupo) */}
          <path
            d={`M ${CX - CAP_R} ${CAP_R + gap} A ${CAP_R} ${CAP_R} 0 0 1 ${CX + CAP_R} ${CAP_R + gap} Z`}
            fill="#0891b2"
            stroke="#22d3ee"
            strokeWidth={1.5}
          />
        </g>

        {/* Indicador de profundidad (fuera del grupo animado) */}
        <line
          x1={TANK_X + TANK_W + 2} y1={midY}
          x2={TANK_X + TANK_W + 7} y2={midY}
          stroke="#34d399" strokeWidth={1.5}
        />
        <text
          x={TANK_X + TANK_W + 9} y={midY + 4}
          fontSize={9} fill="#34d399"
        >
          {depth.toFixed(2)}m
        </text>
      </svg>
    </div>
  )
}
