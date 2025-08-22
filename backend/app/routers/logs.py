# routes/logs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import Log, User, Coin
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class CoinResponse(BaseModel):
    id: int
    name: str
    symbol: str
    color: Optional[str] = None

    class Config:
        from_attributes = True

class LogResponse(BaseModel):
    id: int
    user_id: str
    coin_id: Optional[int] = None
    notified_at: Optional[str] = None
    price: str
    change_percent: Optional[str] = None
    message: Optional[str] = None
    coin: Optional[CoinResponse] = None

    class Config:
        from_attributes = True

def format_log_response(log: Log) -> dict:
    """Format a log object into the response format"""
    log_data = {
        "id": log.id,
        "user_id": str(log.user_id),
        "coin_id": log.coin_id,
        "notified_at": log.notified_at.isoformat() if log.notified_at else None,
        "price": str(log.price) if log.price else "0",
        "change_percent": str(log.change_percent) if log.change_percent else None,
        "message": log.message,
        "coin": None
    }
    
    # Add coin data if available and loaded
    if log.coin:
        log_data["coin"] = {
            "id": log.coin.id,
            "name": log.coin.name,
            "symbol": log.coin.symbol,
            "color": log.coin.color
        }
    
    return log_data

@router.get("/users/{user_id}", response_model=List[LogResponse])
async def get_user_logs(user_id: str, db: Session = Depends(get_db)):
    """Get all logs for a specific user"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Query logs with coin data using joinedload for better performance
        logs = (
            db.query(Log)
            .options(joinedload(Log.coin))
            .filter(Log.user_id == user_id)
            .order_by(Log.notified_at.desc())
            .all()
        )
        
        result = []
        for log in logs:
            result.append(format_log_response(log))
        
        logger.info(f"Retrieved {len(result)} logs for user {user_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching logs for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")

@router.get("/", response_model=List[LogResponse])
async def get_all_logs(limit: int = 100, db: Session = Depends(get_db)):
    """Get all logs (admin only - you may want to add authentication)"""
    try:
        # Query logs with coin data
        logs = (
            db.query(Log)
            .options(joinedload(Log.coin))
            .order_by(Log.notified_at.desc())
            .limit(limit)
            .all()
        )
        
        result = []
        for log in logs:
            result.append(format_log_response(log))
        
        logger.info(f"Retrieved {len(result)} logs (limit: {limit})")
        return result
        
    except Exception as e:
        logger.error(f"Error fetching all logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")

@router.delete("/{log_id}")
async def delete_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a specific log"""
    try:
        log = db.query(Log).filter(Log.id == log_id).first()
        
        if not log:
            raise HTTPException(status_code=404, detail="Log not found")
        
        db.delete(log)
        db.commit()
        
        logger.info(f"Deleted log {log_id}")
        return {"message": f"Log {log_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting log {log_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting log: {str(e)}")

@router.get("/stats/{user_id}")
async def get_user_log_stats(user_id: str, db: Session = Depends(get_db)):
    """Get statistics about user's notification logs"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get basic stats
        total_logs = db.query(Log).filter(Log.user_id == user_id).count()
        
        # Get logs by coin (top 5)
        logs_by_coin = (
            db.query(Log.coin_id, Coin.name, Coin.symbol, db.func.count(Log.id).label('count'))
            .join(Coin, Log.coin_id == Coin.id)
            .filter(Log.user_id == user_id)
            .group_by(Log.coin_id, Coin.name, Coin.symbol)
            .order_by(db.func.count(Log.id).desc())
            .limit(5)
            .all()
        )
        
        # Get recent logs count (last 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_logs = (
            db.query(Log)
            .filter(Log.user_id == user_id)
            .filter(Log.notified_at >= seven_days_ago)
            .count()
        )
        
        stats = {
            "total_logs": total_logs,
            "recent_logs_7_days": recent_logs,
            "logs_by_coin": [
                {
                    "coin_id": coin_id,
                    "coin_name": coin_name,
                    "coin_symbol": coin_symbol,
                    "count": count
                }
                for coin_id, coin_name, coin_symbol, count in logs_by_coin
            ]
        }
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching log stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching log stats: {str(e)}")