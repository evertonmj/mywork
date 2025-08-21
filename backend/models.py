from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimeEntry(BaseModel):
    id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: float = 0.0
    timezone: Optional[str] = None
    comment: Optional[str] = None
