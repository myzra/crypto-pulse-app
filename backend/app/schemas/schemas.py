from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Any, Dict, Literal
from datetime import datetime, time
from decimal import Decimal
import uuid

# Base schemas
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    created_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    raw_user_meta_data: Optional[Dict[str, Any]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# Coin schemas
class CoinBase(BaseSchema):
    name: str
    symbol: str
    color: str

class CoinCreate(CoinBase):
    pass

class CoinUpdate(BaseSchema):
    name: Optional[str] = None
    symbol: Optional[str] = None
    color: Optional[str] = None

class CoinResponse(CoinBase):
    id: int

# CoinPrice schemas
class CoinPriceBase(BaseSchema):
    price: Decimal
    change: Optional[Decimal] = None
    is_positive: Optional[bool] = None

class CoinPriceCreate(CoinPriceBase):
    coin_id: int

class CoinPriceUpdate(BaseSchema):
    price: Optional[Decimal] = None
    change: Optional[Decimal] = None
    is_positive: Optional[bool] = None

class CoinPriceResponse(CoinPriceBase):
    coin_id: int
    updated_at: Optional[datetime] = None

# Favorite schemas
class FavoriteBase(BaseSchema):
    user_id: uuid.UUID
    coin_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteResponse(FavoriteBase):
    created_at: Optional[datetime] = None

# Log schemas
class LogBase(BaseSchema):
    user_id: uuid.UUID
    coin_id: Optional[int] = None
    price: Decimal
    change_percent: Optional[Decimal] = None
    message: Optional[str] = None

class LogCreate(LogBase):
    pass

class LogUpdate(BaseSchema):
    coin_id: Optional[int] = None
    price: Optional[Decimal] = None
    change_percent: Optional[Decimal] = None
    message: Optional[str] = None

class LogResponse(LogBase):
    id: int
    notified_at: Optional[datetime] = None

# Notification schemas
class NotificationCreate(BaseModel):
    user_id: str
    coin_id: str
    frequency_type: Literal["hourly", "daily", "weekly", "custom"]
    interval_hours: Optional[int] = None
    preferred_time: Optional[time] = None
    preferred_day: Optional[int] = None
    
# Extended response schemas with relationships
class CoinWithPrice(CoinResponse):
    price: Optional[CoinPriceResponse] = None

class UserWithFavorites(UserResponse):
    favorites: List[FavoriteResponse] = []

class FavoriteWithCoin(FavoriteResponse):
    coin: CoinResponse

class LogWithCoin(LogResponse):
    coin: Optional[CoinResponse] = None

# Dashboard/summary schemas
class CoinSummary(BaseSchema):
    id: int
    name: str
    symbol: str
    color: str
    price: Optional[Decimal] = None
    change: Optional[Decimal] = None
    is_positive: Optional[bool] = None
    updated_at: Optional[datetime] = None
    is_favorite: bool = False

class UserDashboard(BaseSchema):
    user: UserResponse
    favorite_coins: List[CoinSummary] = []
    recent_logs: List[LogWithCoin] = []
