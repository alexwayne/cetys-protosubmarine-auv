import sqlite3
from pathlib import Path

DB_PATH = Path("data/auv.db")


def get_db():
    """
    FastAPI dependency that opens a SQLite connection, yields it to the route
    handler, then closes it once the response has been sent.

    Usage in a route:
        def my_route(db: sqlite3.Connection = Depends(get_db)):
            ...
    """
    # row_factory makes rows behave like dicts: row["pressure_pa"] instead of row[0]
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist. Called once at app startup."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            label       TEXT    NOT NULL,
            started_at  TEXT    NOT NULL,
            ended_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS telemetry (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   INTEGER REFERENCES sessions(id),
            timestamp    TEXT    NOT NULL,
            pressure_pa  REAL,
            temperature_c REAL,
            accel_x      REAL,
            accel_y      REAL,
            accel_z      REAL,
            gyro_x       REAL,
            gyro_y       REAL,
            gyro_z       REAL,
            motor_steps  INTEGER
        );
    """)
    conn.commit()
    conn.close()
