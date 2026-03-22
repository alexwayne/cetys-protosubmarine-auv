import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from backend.database import get_db
from backend.models.sensor import SensorReading, SensorReadingWithDerived
from backend.services import buoyancy

router = APIRouter()


@router.post("/ingest", status_code=201)
def ingest_telemetry(reading: SensorReading, db: sqlite3.Connection = Depends(get_db)):
    if reading.timestamp is None:
        reading.timestamp = datetime.now(timezone.utc)

    # Find the currently open session, if any.
    # An open session has a started_at but no ended_at yet.
    row = db.execute(
        "SELECT id FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1"
    ).fetchone()
    session_id = row["id"] if row else None

    db.execute(
        """
        INSERT INTO telemetry
            (session_id, timestamp, pressure_pa, temperature_c,
             accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, motor_steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session_id,
            reading.timestamp.isoformat(),
            reading.pressure_pa, reading.temperature_c,
            reading.accel_x, reading.accel_y, reading.accel_z,
            reading.gyro_x, reading.gyro_y, reading.gyro_z,
            reading.motor_steps,
        ),
    )
    db.commit()

    return {"status": "received", "timestamp": reading.timestamp, "session_id": session_id}


@router.get("/latest", response_model=SensorReadingWithDerived)
def get_latest_telemetry(db: sqlite3.Connection = Depends(get_db)):
    row = db.execute(
        "SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1"
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="No telemetry recorded yet")

    # Build the base reading from the stored row.
    # sqlite3.Row doesn't unpack directly into Pydantic — convert to dict first.
    reading = SensorReadingWithDerived(**dict(row))

    # Compute derived physics values.
    # volume_per_step_m3 is a hardware constant — placeholder until calibrated.
    VOLUME_PER_STEP_M3 = 1e-6
    FLUID_DENSITY = 1000.0  # kg/m³ (freshwater; use ~1025 for saltwater)

    displaced_volume = buoyancy.steps_to_volume(reading.motor_steps, VOLUME_PER_STEP_M3)
    reading.buoyancy_force_n = buoyancy.buoyancy_force(FLUID_DENSITY, displaced_volume)
    reading.depth_m = buoyancy.pressure_to_depth(reading.pressure_pa)

    return reading
