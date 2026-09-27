from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import re

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    bio: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email format")
        return v

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "PARTICIPANT"

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = None

class UserOut(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
