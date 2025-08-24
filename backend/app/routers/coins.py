# routes/coins.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Coin, CoinPrice
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import logging

# Import your price service
from app.services.price_service import CoinGeckoPriceService

logger = logging.getLogger(__name__)

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

async def should_update_prices(db: Session) -> bool:
    """Check if prices need updating based on last update time"""
    try:
        # Get the most recent price update
        latest_price = db.query(CoinPrice).order_by(CoinPrice.updated_at.desc()).first()
        
        if not latest_price or not latest_price.updated_at:
            logger.info("No recent price data found, updating prices")
            return True
        
        # Update if last update was more than 5 minutes ago
        time_threshold = datetime.now() - timedelta(minutes=5)
        needs_update = latest_price.updated_at < time_threshold
        
        if needs_update:
            logger.info(f"Prices are stale (last update: {latest_price.updated_at}), updating")
        else:
            logger.info(f"Prices are fresh (last update: {latest_price.updated_at}), skipping update")
            
        return needs_update
        
    except Exception as e:
        logger.error(f"Error checking price update status: {str(e)}")
        return True

async def update_prices_if_needed(db: Session):
    """Update prices if they're stale"""
    try:
        if await should_update_prices(db):
            logger.info("Updating coin prices...")
            await CoinGeckoPriceService.fetch_prices_for_all_coins(db)
            logger.info("Coin prices updated successfully")
        else:
            logger.info("Prices are up to date, skipping update")
    except Exception as e:
        logger.error(f"Error updating prices: {str(e)}")
        # Don't fail the request if price update fails, just log the error

def format_coin_response(coin: Coin) -> dict:
    """Format a coin object into the response format"""
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
    
    return coin_data

@router.get("/", response_model=List[CoinResponse])
async def get_all_coins(db: Session = Depends(get_db)):
    """Get all coins with their current prices (auto-updates prices if stale)"""
    try:
        # Update prices if needed
        await update_prices_if_needed(db)
        
        # Query coins with their prices using a join
        coins = db.query(Coin).options(joinedload(Coin.price)).all()
        
        result = []
        for coin in coins:
            result.append(format_coin_response(coin))
        
        logger.info(f"Retrieved {len(result)} coins")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching coins: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching coins: {str(e)}")

@router.get("/{coin_id}", response_model=CoinResponse)
async def get_coin(coin_id: int, db: Session = Depends(get_db)):
    """Get a specific coin with its current price (auto-updates prices if stale)"""
    try:
        # Update prices if needed
        await update_prices_if_needed(db)
        
        coin = db.query(Coin).options(joinedload(Coin.price)).filter(Coin.id == coin_id).first()
        
        if not coin:
            raise HTTPException(status_code=404, detail="Coin not found")
        
        return format_coin_response(coin)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coin {coin_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching coin: {str(e)}")

@router.post("/update-prices")
async def manually_update_prices(db: Session = Depends(get_db)):
    """Manually trigger price updates (for testing/admin use)"""
    try:
        logger.info("Manual price update triggered")
        await CoinGeckoPriceService.fetch_prices_for_all_coins(db)
        return {"message": "Prices updated successfully"}
    except Exception as e:
        logger.error(f"Manual price update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prices/status")
async def get_price_status(db: Session = Depends(get_db)):
    """Get status of price data (for monitoring)"""
    try:
        latest_price = db.query(CoinPrice).order_by(CoinPrice.updated_at.desc()).first()
        
        if not latest_price:
            return {"status": "no_data", "last_update": None}
        
        time_threshold = datetime.now() - timedelta(minutes=5)
        is_stale = latest_price.updated_at < time_threshold if latest_price.updated_at else True
        
        return {
            "status": "stale" if is_stale else "fresh",
            "last_update": latest_price.updated_at.isoformat() if latest_price.updated_at else None,
            "minutes_since_update": (datetime.now() - latest_price.updated_at).total_seconds() / 60 if latest_price.updated_at else None
        }
        
    except Exception as e:
        logger.error(f"Error getting price status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))