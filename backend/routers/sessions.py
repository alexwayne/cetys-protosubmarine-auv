import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from backend.database import get_db
from backend.models.session import Session, SessionCreate

router = APIRouter()


@router.post("/start", response_model=Session, status_code=201)
def start_session(payload: SessionCreate, db: sqlite3.Connection = Depends(get_db)):
    # Prevent starting a new session while one is already running.
    open_row = db.execute(
        "SELECT id FROM sessions WHERE ended_at IS NULL LIMIT 1"
    ).fetchone()
    if open_row:
        raise HTTPException(
            status_code=409,
            detail=f"Session {open_row['id']} is already running. Stop it first.",
        )

    started_at = datetime.now(timezone.utc)
    cursor = db.execute(
        "INSERT INTO sessions (label, started_at) VALUES (?, ?)",
        (payload.label, started_at.isoformat()),
    )
    db.commit()

    return Session(id=cursor.lastrowid, label=payload.label, started_at=started_at)


@router.post("/stop", response_model=Session)
def stop_session(db: sqlite3.Connection = Depends(get_db)):
    row = db.execute(
        "SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1"
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="No session is currently running")

    ended_at = datetime.now(timezone.utc)
    db.execute(
        "UPDATE sessions SET ended_at = ? WHERE id = ?",
        (ended_at.isoformat(), row["id"]),
    )
    db.commit()

    return Session(
        id=row["id"],
        label=row["label"],
        started_at=row["started_at"],
        ended_at=ended_at,
    )


@router.get("", response_model=list[Session])
def list_sessions(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute(
        "SELECT * FROM sessions ORDER BY started_at DESC"
    ).fetchall()

    return [Session(**dict(r)) for r in rows]
