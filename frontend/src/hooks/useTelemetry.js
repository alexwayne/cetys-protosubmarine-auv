import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_INTERVAL_MS = 500
const MAX_READINGS = 100

// Hardware constants — match backend/services/buoyancy.py
const GRAVITY = 9.81
const VOLUME_PER_STEP_M3 = 2.44e-8   // calibration estimate; 50ml syringe / 2048 steps
const FLUID_DENSITY = 1025            // kg/m³ (saltwater)
const SURFACE_PRESSURE_PA = 101_325

/**
 * Generates a single fake telemetry reading for simulation/demo mode.
 * Simulates the AUV diving and surfacing by oscillating motor_steps
 * between 0 (fully retracted → less buoyancy → deeper) and 1024
 * (extended → more buoyancy → shallower).
 */
function generateMockReading(tick) {
  // Smooth 0 → 1024 → 0 oscillation over ~125 ticks (~62 s)
  const motor_steps = Math.round(512 * (1 - Math.cos(tick * 0.05)))

  const displaced_volume = motor_steps * VOLUME_PER_STEP_M3
  const buoyancy_force_n = FLUID_DENSITY * GRAVITY * displaced_volume

  // More steps = more buoyancy = AUV rises = shallower depth
  const depth_m = Math.max(0, 2.0 * (1 - motor_steps / 1024) + (Math.random() - 0.5) * 0.05)
  const pressure_pa = SURFACE_PRESSURE_PA + depth_m * 1000 * GRAVITY

  return {
    timestamp: new Date().toISOString(),
    motor_steps,
    pressure_pa: Math.round(pressure_pa * 10) / 10,
    temperature_c: 22.5 + (Math.random() - 0.5) * 0.2,
    accel_x: (Math.random() - 0.5) * 0.1,
    accel_y: (Math.random() - 0.5) * 0.1,
    accel_z: -9.81 + (Math.random() - 0.5) * 0.05,
    gyro_x: (Math.random() - 0.5) * 0.01,
    gyro_y: (Math.random() - 0.5) * 0.01,
    gyro_z: (Math.random() - 0.5) * 0.01,
    buoyancy_force_n: Math.round(buoyancy_force_n * 10000) / 10000,
    depth_m: Math.round(depth_m * 100) / 100,
  }
}

/**
 * Polls the backend (or generates mock data) at a fixed interval.
 *
 * @param {boolean} mockMode - When true, generates fake data without hitting the API.
 * @returns {{ readings: object[], isConnected: boolean }}
 */
export function useTelemetry(mockMode) {
  const [readings, setReadings] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const tickRef = useRef(0)

  const pushReading = useCallback((reading) => {
    setReadings(prev => {
      const next = [...prev, reading]
      return next.length > MAX_READINGS ? next.slice(-MAX_READINGS) : next
    })
  }, [])

  useEffect(() => {
    // Reset state when mode switches
    setReadings([])
    setIsConnected(false)
    tickRef.current = 0

    const interval = setInterval(async () => {
      if (mockMode) {
        tickRef.current += 1
        pushReading(generateMockReading(tickRef.current))
        setIsConnected(true)
      } else {
        try {
          const res = await fetch('http://localhost:8000/telemetry/latest')
          if (!res.ok) throw new Error('bad response')
          const data = await res.json()
          pushReading(data)
          setIsConnected(true)
        } catch {
          setIsConnected(false)
        }
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [mockMode, pushReading])

  return { readings, isConnected }
}
