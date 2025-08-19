# routes/coins.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Coin, CoinPrice
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

router = APIRouter()

class CoinPriceResponse(BaseModel):
    current_price: Optional[float] = None
    change_24h: Optional[float] = None
    is_positive: Optional[bool] = None
    updated_at: Optional[str] = None

class CoinResponse(BaseModel):
    id: int
    name: str
    symbol: str
    color: str
    price: Optional[CoinPriceResponse] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CoinResponse])
async def get_all_coins(db: Session = Depends(get_db)):
    """Get all coins with their current prices"""
    try:
        # Query coins with their prices using a join
        coins = db.query(Coin).options(joinedload(Coin.price)).all()
        
        result = []
        for coin in coins:
            coin_data = {
                "id": coin.id,
                "name": coin.name,
                "symbol": coin.symbol,
                "color": coin.color,
                "price": None
            }
            
            # Add price data if available
            if coin.price:
                coin_data["price"] = {
                    "current_price": float(coin.price.price) if coin.price.price else None,
                    "change_24h": float(coin.price.change) if coin.price.change else None,
                    "is_positive": coin.price.is_positive,
                    "updated_at": coin.price.updated_at.isoformat() if coin.price.updated_at else None
                }
            
            result.append(coin_data)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching coins: {str(e)}")

@router.get("/{coin_id}", response_model=CoinResponse)
async def get_coin(coin_id: int, db: Session = Depends(get_db)):
    """Get a specific coin with its current price"""
    try:
        coin = db.query(Coin).options(joinedload(Coin.price)).filter(Coin.id == coin_id).first()
        
        if not coin:
            raise HTTPException(status_code=404, detail="Coin not found")
        
        coin_data = {
            "id": coin.id,
            "name": coin.name,
            "symbol": coin.symbol,
            "color": coin.color,
            "price": None
        }
        
        if coin.price:
            coin_data["price"] = {
                "current_price": float(coin.price.price) if coin.price.price else None,
                "change_24h": float(coin.price.change) if coin.price.change else None,
                "is_positive": coin.price.is_positive,
                "updated_at": coin.price.updated_at.isoformat() if coin.price.updated_at else None
            }
        
        return coin_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching coin: {str(e)}")