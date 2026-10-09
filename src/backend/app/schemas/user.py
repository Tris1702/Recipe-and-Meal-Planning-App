from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class User(BaseModel):
    id: int
    name: str
    birth_date: date | None = None
    gender: Gender | None = None
    height_cm: float | None = None
    weight_g: float | None = None
    daily_calorie_goals: float | None = None
    created_at: datetime = Field(default_factory=datetime.now)
