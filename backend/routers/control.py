"""
Control channel — routes commands from the dashboard to the ESP32.

Architecture (pull model):
  1. Dashboard sends POST /control/command  → command is stored in memory, status = "pending"
  2. ESP32 polls  GET  /control/pending     → receives command, status = "executing"
  3. ESP32 calls  POST /control/ack         → status = "done"
  4. Dashboard polls  GET  /control/status  → reads current status

Commands are kept in memory (not the DB) because they are ephemeral signals,
not experiment data. Only one command can be active at a time.
"""

from fastapi import APIRouter, HTTPException

from backend.models.control import CommandStatus, ControlCommand

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory command state.
# A single pending command slot is enough for this prototype.
# ---------------------------------------------------------------------------
_current_command: ControlCommand | None = None
_status: str = "idle"   # idle | pending | executing | done


def _make_status() -> CommandStatus:
    return CommandStatus(
        action=_current_command.action if _current_command else "none",
        status=_status,
        target_depth_m=_current_command.target_depth_m if _current_command else None,
        speed_rpm=_current_command.speed_rpm if _current_command else None,
    )


# ---------------------------------------------------------------------------
# Dashboard → FastAPI
# ---------------------------------------------------------------------------

@router.post("/command", response_model=CommandStatus, status_code=202)
def send_command(payload: ControlCommand):
    """
    Dashboard sends a motion command.
    Replaces any previously pending command that has not yet been picked up
    by the ESP32 — latest instruction always wins.
    """
    global _current_command, _status

    if payload.action == "hold" and payload.target_depth_m is None:
        raise HTTPException(
            status_code=422,
            detail="target_depth_m is required when action is 'hold'.",
        )

    _current_command = payload
    _status = "pending"
    return _make_status()


@router.get("/status", response_model=CommandStatus)
def get_status():
    """
    Dashboard polls this to track whether the ESP32 has picked up and
    executed the last command.
    """
    return _make_status()


# ---------------------------------------------------------------------------
# ESP32 → FastAPI
# ---------------------------------------------------------------------------

@router.get("/pending", response_model=CommandStatus)
def get_pending():
    """
    ESP32 polls this endpoint on every telemetry cycle.
    Returns the pending command (and marks it as 'executing') or
    action='none' if nothing is waiting.
    """
    global _status

    if _status == "pending" and _current_command is not None:
        _status = "executing"

    return _make_status()


@router.post("/ack", response_model=CommandStatus)
def acknowledge():
    """
    ESP32 calls this after it finishes executing a command.
    Marks the command as 'done' so the dashboard knows it was handled.
    """
    global _status

    if _status != "executing":
        raise HTTPException(
            status_code=409,
            detail=f"No command is currently executing (status: {_status}).",
        )

    _status = "done"
    return _make_status()
