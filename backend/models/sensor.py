from datetime import datetime
from pydantic import BaseModel


class SensorReading(BaseModel):
    # BMP280 — barometric sensor
    pressure_pa: float
    temperature_c: float

    # MPU6050 — inertial measurement unit
    accel_x: float  # m/s²
    accel_y: float
    accel_z: float
    gyro_x: float   # rad/s
    gyro_y: float
    gyro_z: float

    # 28BYJ-48 stepper position (steps from home, 2048 steps/rev)
    motor_steps: int

    # Optional: the ESP32 can include its own timestamp, or the server will
    # assign one at ingestion time. Fields with a default are never required.
    timestamp: datetime | None = None


class SensorReadingWithDerived(SensorReading):
    """
    Extends SensorReading with server-computed physics values.
    Returned by GET /telemetry/latest so the frontend gets raw + derived data
    in a single response.
    """
    buoyancy_force_n: float | None = None   # Newtons
    depth_m: float | None = None            # metres (positive = submerged)
