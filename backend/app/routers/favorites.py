# routes/favorites.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.models import Coin, CoinPrice, Favorite
from pydantic import BaseModel
from typing import List
from uuid import UUID
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class FavoriteRequest(BaseModel):
    user_id: str
    coin_id: int

class FavoriteResponse(BaseModel):
    user_id: str
    coin_id: int
    created_at: str

class CoinPriceResponse(BaseModel):
    current_price: float = None
    change_24h: float = None
    is_positive: bool = None
    updated_at: str = None

class FavoriteCoinResponse(BaseModel):
    id: int
    name: str
    symbol: str
    color: str
    price: CoinPriceResponse = None
    is_favorite: bool = True
    created_at: str

@router.get("/users/{user_id}/favorites", response_model=List[FavoriteCoinResponse])
async def get_user_favorites(user_id: str, db: Session = Depends(get_db)):
    """Get all favorite coins for a user"""
    try:
        # Validate UUID
        user_uuid = UUID(user_id)
        
        # Query favorites with coin and price data
        favorites = db.query(Favorite)\
            .options(
                joinedload(Favorite.coin).joinedload(Coin.price)
            )\
            .filter(Favorite.user_id == user_uuid)\
            .all()
        
        result = []
        for favorite in favorites:
            coin = favorite.coin
            coin_data = {
                "id": coin.id,
                "name": coin.name,
                "symbol": coin.symbol,
                "color": coin.color,
                "price": None,
                "is_favorite": True,
                "created_at": favorite.created_at.isoformat() if favorite.created_at else None
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
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        logger.error(f"Error fetching user favorites: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching favorites: {str(e)}")

@router.post("/", response_model=dict)
async def add_favorite(request: FavoriteRequest, db: Session = Depends(get_db)):
    """Add a coin to user's favorites"""
    try:
        # Validate UUID
        user_uuid = UUID(request.user_id)
        
        # Check if coin exists
        coin = db.query(Coin).filter(Coin.id == request.coin_id).first()
        if not coin:
            raise HTTPException(status_code=404, detail="Coin not found")
        
        # Check if already favorited
        existing = db.query(Favorite).filter(
            Favorite.user_id == user_uuid,
            Favorite.coin_id == request.coin_id
        ).first()
        
        if existing:
            return {"message": "Coin already in favorites", "is_favorite": True}
        
        # Create new favorite
        new_favorite = Favorite(
            user_id=user_uuid,
            coin_id=request.coin_id
        )
        
        db.add(new_favorite)
        db.commit()
        
        logger.info(f"Added coin {request.coin_id} to favorites for user {request.user_id}")
        return {"message": "Coin added to favorites", "is_favorite": True}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(status_code=409, detail="Favorite already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding favorite: {str(e)}")

@router.delete("/{user_id}/{coin_id}", response_model=dict)
async def remove_favorite(user_id: str, coin_id: int, db: Session = Depends(get_db)):
    try:
        user_uuid = UUID(user_id)
        
        favorite = db.query(Favorite).filter(
            Favorite.user_id == user_uuid,
            Favorite.coin_id == coin_id
        ).first()
        
        if not favorite:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        db.delete(favorite)
        db.commit()
        
        logger.info(f"Removed coin {coin_id} from favorites for user {user_id}")
        return {"message": "Coin removed from favorites", "is_favorite": False}
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing favorite: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error removing favorite: {str(e)}")



@router.get("/users/{user_id}/favorites/check/{coin_id}")
async def check_favorite_status(user_id: str, coin_id: int, db: Session = Depends(get_db)):
    """Check if a coin is in user's favorites"""
    try:
        user_uuid = UUID(user_id)
        
        favorite = db.query(Favorite).filter(
            Favorite.user_id == user_uuid,
            Favorite.coin_id == coin_id
        ).first()
        
        return {"is_favorite": favorite is not None}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        logger.error(f"Error checking favorite status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking favorite: {str(e)}")