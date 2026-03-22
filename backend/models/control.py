from typing import Literal
from pydantic import BaseModel, Field


class ControlCommand(BaseModel):
    """
    Command sent from the dashboard to the ESP32 via the control channel.

    The ESP32 polls GET /control/pending and executes whichever command
    it finds. Logic for 'hold' (hysteresis depth-hold) lives entirely
    in the ESP32 firmware — this model just carries the parameters.
    """
    action: Literal["surface", "dive", "hold", "stop"]
    target_depth_m: float | None = Field(
        default=None,
        description="Required when action is 'hold'. Target depth in metres.",
    )
    speed_rpm: int = Field(
        default=10,
        ge=1,
        le=15,
        description="Motor speed in RPM. Max 15 RPM for the 28BYJ-48.",
    )


class CommandStatus(BaseModel):
    """
    Current state of the command channel, returned by GET /control/status.
    'action' is 'none' when no command is active.
    """
    action: str
    status: Literal["idle", "pending", "executing", "done"]
    target_depth_m: float | None = None
    speed_rpm: int | None = None
