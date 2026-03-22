import csv
import io
import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from backend.database import get_db

router = APIRouter()

# Column order for the CSV — matches the telemetry table schema.
TELEMETRY_COLUMNS = [
    "id", "session_id", "timestamp",
    "pressure_pa", "temperature_c",
    "accel_x", "accel_y", "accel_z",
    "gyro_x", "gyro_y", "gyro_z",
    "motor_steps",
]


@router.get("/{session_id}/export")
def export_session(session_id: int, db: sqlite3.Connection = Depends(get_db)):
    # Confirm the session exists before streaming anything.
    # Without this check, an unknown id would just return an empty CSV with
    # only a header row — confusing and silent.
    session = db.execute(
        "SELECT id, label FROM sessions WHERE id = ?", (session_id,)
    ).fetchone()

    if session is None:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    rows = db.execute(
        "SELECT * FROM telemetry WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,),
    ).fetchall()

    def generate_csv():
        # io.StringIO is an in-memory text buffer — csv.writer needs a file-like
        # object to write into, and we yield each line as a string.
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        # Header row
        writer.writerow(TELEMETRY_COLUMNS)
        yield buffer.getvalue()

        # One data row at a time — this is what makes it a stream.
        for row in rows:
            buffer.seek(0)
            buffer.truncate()
            writer.writerow([row[col] for col in TELEMETRY_COLUMNS])
            yield buffer.getvalue()

    filename = f"session_{session_id}_{session['label'].replace(' ', '_')}.csv"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(generate_csv(), media_type="text/csv", headers=headers)
