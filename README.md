# Proto-AUV Variable Volume · Buoyancy Control Web Dashboard

Full-stack web application for real-time telemetry, data acquisition, and
visualization of a variable-volume AUV prototype that controls buoyancy
via volume variation using the Archimedes Principle.

Built with **FastAPI** + **React** as part of a doctoral research experiment
at Cetys Universidad.

---

## Project Context

This repo is the **web application component** of a multi-part experimental
project. The broader experiment is divided into:

1. **Physical modeling & experimental measurements** — prototype design,
   fabrication, and empirical data collection (other team members)
2. **Dynamic modeling of vertical motion** — mathematical modeling of
   buoyancy-driven ascent/descent (other team members)
3. **Web dashboard** ← *this repo* — telemetry ingestion, real-time
   visualization, and experiment session management

The physical prototype is built around an **ESP32 DevKit V1** with the
following sensor suite:

| Component | Model | Protocol | Role |
|-----------|-------|----------|------|
| Microcontroller | ESP32 DevKit V1 | — | Wi-Fi, logic |
| IMU | MPU6050 | I2C (0x68) | 3-axis accel + gyro |
| Barometric sensor | BMP280-3.3 | I2C (0x76) | Pressure, temperature, estimated altitude |
| Stepper motor | 28BYJ-48 + ULN2003 | GPIO | Volume variation actuator |
| Display | TFT ILI9341 2.8" | SPI | Local onboard display |
| Power | 18650 Li-Ion + LM2596 | — | Regulated 3.3V / 5V |

The ESP32 exposes sensor readings over Wi-Fi. This FastAPI application
consumes that data stream and provides a richer visualization and logging
layer for experiment analysis.

---

## Physics Background

The prototype controls buoyancy by varying its internal volume, altering
the displaced fluid mass and therefore the net buoyant force:
```
F_b = ρ · g · V
```

Where:
- `ρ` = fluid density (kg/m³)
- `g` = gravitational acceleration (9.81 m/s²)
- `V` = displaced volume (m³)

The stepper motor (28BYJ-48, 2048 steps/rev with gearbox) drives the
volume variation mechanism. The BMP280 tracks pressure changes during
vertical motion; the MPU6050 captures acceleration along the Z-axis to
characterize ascent/descent dynamics.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python 3.11+) |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Real-time data | WebSocket from ESP32 |
| Data storage | SQLite + CSV export |

---

## Data Flow

```
ESP32 (MPU6050 + BMP280 + stepper)
    │  Wi-Fi (HTTP POST / WebSocket)
    ▼
FastAPI backend  ──→  SQLite (sessions)
    │
    │  REST API + WebSocket
    ▼
React frontend (Recharts dashboard)
    │
    ▼
CSV / JSON export
```

---

## Project Structure
```
proto-auv/
├── backend/
│   ├── main.py              # FastAPI app entry point, CORS config
│   ├── routers/
│   │   ├── telemetry.py     # Sensor data ingestion endpoints
│   │   ├── sessions.py      # Experiment session management
│   │   └── export.py        # CSV / JSON data export
│   ├── models/
│   │   ├── sensor.py        # Pydantic models for sensor readings
│   │   └── session.py       # Experiment session schema
│   └── services/
│       └── buoyancy.py      # Archimedes calculations, derived metrics
├── frontend/
│   └── src/
│       ├── App.jsx              # Root component, WebSocket setup
│       ├── components/
│       │   ├── TelemetryChart.jsx   # Recharts time-series plots
│       │   ├── SessionControls.jsx  # Start/stop session, labeling
│       │   └── ExportButton.jsx     # CSV / JSON download trigger
│       └── hooks/
│           └── useTelemetry.js      # WebSocket state management
├── data/
│   ├── sessions/            # Stored experiment runs
│   └── sample/              # Sample datasets for development
├── docs/
│   ├── hardware/            # Datasheets & wiring diagrams
│   └── experiment_protocol.md
├── requirements.txt
└── README.md
```

---

## Features

- [ ] Real-time telemetry dashboard — live plots of pressure, acceleration
  (Z-axis), estimated depth/altitude, and motor position
- [ ] Experiment session management — start/stop recording, label runs,
  annotate events (e.g., direction change, target depth reached)
- [ ] Buoyancy force visualization — computed F_b over time based on
  BMP280 pressure readings and known fluid density
- [ ] Vertical motion trajectory — depth vs. time plots for comparison
  against the dynamic model produced by other team members
- [ ] Data export — CSV and JSON export per session for external analysis
  (MATLAB, Python, Excel)
- [ ] REST API — clean endpoints for integration with the ESP32 data
  stream and potential future hardware iterations

---

## Hardware Setup Reference

### ESP32 Pin Mapping

**TFT ILI9341 (SPI)**

| TFT Pin | ESP32 Pin |
|---------|-----------|
| CS | D5 |
| RST | D4 |
| DC | D2 |
| MOSI | D23 |
| SCK | D18 |
| LED | 3V3 |

**MPU6050 + BMP280 (shared I2C bus)**

| Sensor Pin | ESP32 Pin |
|------------|-----------|
| SCL | D22 |
| SDA | D21 |

- MPU6050 I2C address: `0x68` (AD0 → GND)
- BMP280 I2C address: `0x76` (SDO → GND)

**28BYJ-48 Stepper via ULN2003**

| ULN2003 | ESP32 Pin |
|---------|-----------|
| IN1 | D13 |
| IN2 | D12 |
| IN3 | D14 |
| IN4 | D27 |
| VCC | VIN (5V) |

> ⚠️ Power the stepper from VIN (5V), not from 3V3.

---

## API Endpoints (Planned)
```
GET  /telemetry/latest      → most recent sensor snapshot
POST /telemetry/ingest      → receive data from ESP32
GET  /sessions              → list all experiment sessions
POST /sessions/start        → begin a new recorded session
POST /sessions/stop         → end the current session
GET  /sessions/{id}/export  → download session data as CSV
```

---

## Getting Started

### Backend
```bash
git clone https://github.com/alexwayne/cetys-protosubmarine-auv.git
cd cetys-protosubmarine-auv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

API docs available at `http://localhost:8000/docs` (Swagger UI).

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:5173`.

> The backend must be running for the frontend to receive telemetry data.
> FastAPI is configured to allow CORS requests from `localhost:5173`.

---

## Academic References

- Binti Syafie, L. S., Bin Zainal Abidin, Z., & Bin Alang Md Rashid, N. K.
  *Development of a Buoyancy Control Device for Autonomous Underwater Vehicle.*
  TATI University College; International Islamic University Malaysia;
  University Teknologi Mara.

- Carneiro, J. F., de Almeida, F. G., Pinto, J. B., & Cruz, N. (2019).
  *Using a variable buoyancy system for energy savings in an AUV.*
  Faculdade de Engenharia, Universidade do Porto.

- Medvedev, A. V., Kostenko, V. V., & Tolstonogov, A. Y.
  *Depth Control Methods of Variable Buoyancy AUV.*
  Institute of Marine Technology Problems FEB RAS.

- Ponce, M. *Proto-Submarino de Volumen Variable.*
  [Experimental activity description document.]

- Sylvester, A. H. III, Delmerico, J. A., Trimble, A. Z., & Bingham, B. S.
  *Variable Buoyancy Control for a Bottom Skimming Autonomous Underwater Vehicle.*
  Field Robotics Laboratory, University of Hawaii at Manoa.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Cetys Universidad · Doctoral Research Experiment*
