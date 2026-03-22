from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    """Payload the client sends to start a new session."""
    label: str


class Session(BaseModel):
    """Full session record returned from the API."""
    id: int | None = None
    label: str
    started_at: datetime
    ended_at: datetime | None = None
