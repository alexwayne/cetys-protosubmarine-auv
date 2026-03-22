# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Proto-AUV Variable Volume · Buoyancy Control Web Dashboard** — a FastAPI backend (Python 3.11+) that ingests real-time telemetry from an ESP32-based AUV prototype and serves a visualization/session-management dashboard. This is the web app component of a doctoral research experiment at Cetys Universidad.

The physical prototype controls buoyancy via volume variation (`F_b = ρ · g · V`), driven by a 28BYJ-48 stepper motor. Sensors: MPU6050 (IMU, I2C 0x68) and BMP280 (barometric, I2C 0x76) on a shared I2C bus; TFT ILI9341 display over SPI. The ESP32 streams sensor data over Wi-Fi to this application.

## Collaboration Style

- **Backend (FastAPI):** User is learning FastAPI for the first time. Act as a mentor — explain concepts, patterns, and *why* decisions are made, not just what to write. Prefer teaching over just giving code.
- **Frontend (React):** User wants help implementing the frontend but is not primarily focused on learning it. Still explain what you're doing and why, but implementation help is the priority here.
- Always explain before writing code. Ask for clarification when requirements are ambiguous.

## Tech Stack

### Backend
- **FastAPI** (Python 3.11+)
- **SQLite** for experiment session storage
- CSV flat-file export per session

### Frontend
- **React 18** via **Vite**
- **Recharts** for time-series data visualization
- **Tailwind CSS** for styling
- HTTP polling (`setInterval` + `fetch`) for real-time telemetry — 500 ms interval
- Dark mode default with light mode toggle (Tailwind class-based)

## Development Setup

### Backend
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Swagger UI at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Dev server at `http://localhost:5173` (Vite default).

## Architecture

### Backend — FastAPI router-per-domain pattern

```
backend/
├── main.py              # App entry point, router registration, CORS config
├── routers/
│   ├── telemetry.py     # POST /telemetry/ingest, GET /telemetry/latest
│   ├── sessions.py      # Session start/stop/list
│   ├── export.py        # CSV/JSON export per session
│   └── control.py       # POST /control/command, GET /control/pending, POST /control/ack
├── models/
│   ├── sensor.py        # Pydantic models for MPU6050 + BMP280 readings
│   ├── session.py       # Experiment session schema
│   └── control.py       # ControlCommand model (action, target_depth_m, speed_rpm)
└── services/
    └── buoyancy.py      # Archimedes-based derived metrics (F_b, depth estimate)
```

CORS must be configured in `main.py` to allow the Vite dev server (`localhost:5173`) to call the API.

### Frontend — component breakdown

```
frontend/src/
├── App.jsx              # Root, polling setup, dark/mock mode state
├── components/
│   ├── TelemetryChart.jsx    # Recharts time-series for F_b / depth / motor / accel-z
│   ├── SessionControls.jsx   # Start/stop session, label input
│   ├── ExportButton.jsx      # Triggers CSV download
│   └── VehicleControls.jsx   # Surface / Dive / Hold-at-depth / Stop commands
└── hooks/
    └── useTelemetry.js       # HTTP polling hook + mock simulation mode
```

## Key Domain Concepts

- **Session**: a bounded experiment run with start/stop timestamps, label, and associated telemetry records.
- **Telemetry record**: timestamped snapshot from the ESP32 — pressure (Pa), temperature (°C), acceleration XYZ (m/s²), gyro XYZ (rad/s), motor position (steps).
- **Buoyancy force**: derived in `services/buoyancy.py` from BMP280 pressure readings and a configured fluid density.
- **Motor position**: expressed in stepper steps (2048 steps/rev with gearbox); maps to displaced volume for F_b calculation.
- **Control command**: an action sent from the dashboard that the ESP32 will execute on its next poll cycle. Actions: `surface`, `dive`, `hold`, `stop`. The `hold` action requires a `target_depth_m` value.
- **Command channel (pull model)**: The ESP32 polls `GET /control/pending` each time it ingests telemetry. FastAPI never pushes to the ESP32 directly — this avoids IP/NAT complexity and keeps the ESP32 as the initiator of all connections.
- **Depth-hold strategy**: hysteresis. If `depth > target + threshold` → surface a bit; if `depth < target - threshold` → dive a bit; otherwise hold. Logic lives entirely in ESP32 firmware. Upgrading to a P-controller later only requires changing one firmware function — the API and dashboard are unaffected.
- **UI language**: Mexican Spanish throughout all frontend components.

## Motor Hardware Reference (28BYJ-48 + ULN2003)

| Parameter | Value |
|-----------|-------|
| Steps/revolution | 2048 (half-step mode with gearbox) |
| Max speed (no load) | ~15 RPM |
| Phase GPIO pins | IN1=D13, IN2=D12, IN3=D14, IN4=D27 |
| Phase init order | `Stepper(2048, IN1, IN3, IN2, IN4)` — order matters |
| Supply voltage | 5V from VIN (not 3V3) |
| Surface direction | Increase motor_steps (extend volume → more buoyancy) |
| Dive direction | Decrease motor_steps (retract volume → less buoyancy) |

## Control Command Model

```python
class ControlCommand(BaseModel):
    action: Literal["surface", "dive", "hold", "stop"]
    target_depth_m: float | None = None   # required when action == "hold"
    speed_rpm: int = 10                   # motor speed, max 15 RPM
```

## API Surface

```
# Telemetry
GET  /telemetry/latest
POST /telemetry/ingest

# Sessions
GET  /sessions
POST /sessions/start
POST /sessions/stop
GET  /sessions/{id}/export

# Vehicle control
POST /control/command     → dashboard sends a command (dive / surface / hold / stop)
GET  /control/pending     → ESP32 polls for the next command to execute
POST /control/ack         → ESP32 confirms command was executed
GET  /control/status      → dashboard polls for current command status
```
