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
- Native browser `WebSocket` API for real-time telemetry

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
│   └── export.py        # CSV/JSON export per session
├── models/
│   ├── sensor.py        # Pydantic models for MPU6050 + BMP280 readings
│   └── session.py       # Experiment session schema
└── services/
    └── buoyancy.py      # Archimedes-based derived metrics (F_b, depth estimate)
```

CORS must be configured in `main.py` to allow the Vite dev server (`localhost:5173`) to call the API.

### Frontend — component breakdown (planned)

```
frontend/src/
├── App.jsx              # Root, WebSocket connection setup
├── components/
│   ├── TelemetryChart.jsx   # Recharts time-series for pressure / accel / F_b
│   ├── SessionControls.jsx  # Start/stop session, label input
│   └── ExportButton.jsx     # Triggers CSV download
└── hooks/
    └── useTelemetry.js      # WebSocket state management hook
```

## Key Domain Concepts

- **Session**: a bounded experiment run with start/stop timestamps, label, and associated telemetry records.
- **Telemetry record**: timestamped snapshot from the ESP32 — pressure (Pa), temperature (°C), acceleration XYZ (m/s²), gyro XYZ (rad/s), motor position (steps).
- **Buoyancy force**: derived in `services/buoyancy.py` from BMP280 pressure readings and a configured fluid density.
- **Motor position**: expressed in stepper steps (2048 steps/rev with gearbox); maps to displaced volume for F_b calculation.

## Planned API Surface

```
GET  /telemetry/latest
POST /telemetry/ingest
GET  /sessions
POST /sessions/start
POST /sessions/stop
GET  /sessions/{id}/export
```
