from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_
from typing import Optional, List
import uuid
from decimal import Decimal

from app.models.models import User, Coin, CoinPrice, Favorite, Log, Notification
from app.schemas.schemas import (
    UserCreate, UserUpdate, CoinCreate, CoinUpdate, 
    CoinPriceCreate, CoinPriceUpdate, FavoriteCreate, 
    LogCreate, LogUpdate, NotificationCreate
)

# User CRUD operations
class UserCRUD:
    @staticmethod
    def get_user(db: Session, user_id: uuid.UUID) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        db_user = User(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update_user(db: Session, user_id: uuid.UUID, user_update: UserUpdate) -> Optional[User]:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            update_data = user_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_user, field, value)
            db.commit()
            db.refresh(db_user)
        return db_user
    
    @staticmethod
    def delete_user(db: Session, user_id: uuid.UUID) -> bool:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False

# Coin CRUD operations
class CoinCRUD:
    @staticmethod
    def get_coin(db: Session, coin_id: int) -> Optional[Coin]:
        return db.query(Coin).filter(Coin.id == coin_id).first()
    
    @staticmethod
    def get_coin_by_symbol(db: Session, symbol: str) -> Optional[Coin]:
        return db.query(Coin).filter(Coin.symbol == symbol).first()
    
    @staticmethod
    def get_coins(db: Session, skip: int = 0, limit: int = 100) -> List[Coin]:
        return db.query(Coin).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_coins_with_prices(db: Session, skip: int = 0, limit: int = 100) -> List[Coin]:
        return (
            db.query(Coin)
            .options(joinedload(Coin.price))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def create_coin(db: Session, coin: CoinCreate) -> Coin:
        db_coin = Coin(**coin.model_dump())
        db.add(db_coin)
        db.commit()
        db.refresh(db_coin)
        return db_coin
    
    @staticmethod
    def update_coin(db: Session, coin_id: int, coin_update: CoinUpdate) -> Optional[Coin]:
        db_coin = db.query(Coin).filter(Coin.id == coin_id).first()
        if db_coin:
            update_data = coin_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_coin, field, value)
            db.commit()
            db.refresh(db_coin)
        return db_coin
    
    @staticmethod
    def delete_coin(db: Session, coin_id: int) -> bool:
        db_coin = db.query(Coin).filter(Coin.id == coin_id).first()
        if db_coin:
            db.delete(db_coin)
            db.commit()
            return True
        return False

# CoinPrice CRUD operations
class CoinPriceCRUD:
    @staticmethod
    def get_coin_price(db: Session, coin_id: int) -> Optional[CoinPrice]:
        return db.query(CoinPrice).filter(CoinPrice.coin_id == coin_id).first()
    
    @staticmethod
    def create_or_update_coin_price(db: Session, coin_price: CoinPriceCreate) -> CoinPrice:
        db_price = db.query(CoinPrice).filter(CoinPrice.coin_id == coin_price.coin_id).first()
        
        if db_price:
            # Update existing price
            update_data = coin_price.model_dump()
            for field, value in update_data.items():
                setattr(db_price, field, value)
        else:
            # Create new price entry
            db_price = CoinPrice(**coin_price.model_dump())
            db.add(db_price)
        
        db.commit()
        db.refresh(db_price)
        return db_price
    
    @staticmethod
    def delete_coin_price(db: Session, coin_id: int) -> bool:
        db_price = db.query(CoinPrice).filter(CoinPrice.coin_id == coin_id).first()
        if db_price:
            db.delete(db_price)
            db.commit()
            return True
        return False

# Favorite CRUD operations
class FavoriteCRUD:
    @staticmethod
    def get_user_favorites(db: Session, user_id: uuid.UUID) -> List[Favorite]:
        return (
            db.query(Favorite)
            .options(joinedload(Favorite.coin))
            .filter(Favorite.user_id == user_id)
            .all()
        )
    
    @staticmethod
    def get_user_favorites_with_prices(db: Session, user_id: uuid.UUID) -> List[Favorite]:
        return (
            db.query(Favorite)
            .options(
                joinedload(Favorite.coin).joinedload(Coin.price)
            )
            .filter(Favorite.user_id == user_id)
            .all()
        )
    
    @staticmethod
    def add_favorite(db: Session, favorite: FavoriteCreate) -> Favorite:
        db_favorite = Favorite(**favorite.model_dump())
        db.add(db_favorite)
        db.commit()
        db.refresh(db_favorite)
        return db_favorite
    
    @staticmethod
    def remove_favorite(db: Session, user_id: uuid.UUID, coin_id: int) -> bool:
        db_favorite = db.query(Favorite).filter(
            and_(Favorite.user_id == user_id, Favorite.coin_id == coin_id)
        ).first()
        if db_favorite:
            db.delete(db_favorite)
            db.commit()
            return True
        return False
    
    @staticmethod
    def is_favorite(db: Session, user_id: uuid.UUID, coin_id: int) -> bool:
        return db.query(Favorite).filter(
            and_(Favorite.user_id == user_id, Favorite.coin_id == coin_id)
        ).first() is not None

# Log CRUD operations
class LogCRUD:
    @staticmethod
    def get_user_logs(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Log]:
        return (
            db.query(Log)
            .options(joinedload(Log.coin))
            .filter(Log.user_id == user_id)
            .order_by(desc(Log.notified_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def create_log(db: Session, log: LogCreate) -> Log:
        db_log = Log(**log.model_dump())
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    
    @staticmethod
    def update_log(db: Session, log_id: int, log_update: LogUpdate) -> Optional[Log]:
        db_log = db.query(Log).filter(Log.id == log_id).first()
        if db_log:
            update_data = log_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_log, field, value)
            db.commit()
            db.refresh(db_log)
        return db_log
    
    @staticmethod
    def delete_log(db: Session, log_id: int) -> bool:
        db_log = db.query(Log).filter(Log.id == log_id).first()
        if db_log:
            db.delete(db_log)
            db.commit()
            return True
        return False

# Notification CRUD operations
class NotificationCRUD:
    @staticmethod
    def get_user_notification(db: Session, user_id: uuid.UUID) -> Optional[Notification]:
        return (
            db.query(Notification)
            .options(joinedload(Notification.coin))
            .filter(Notification.user_id == user_id)
            .first()
        )
    
    @staticmethod
    def create_or_update_notification(db: Session, notification: NotificationCreate) -> Notification:
        db_notification = db.query(Notification).filter(
            Notification.user_id == notification.user_id
        ).first()
        
        if db_notification:
            # Update existing notification
            update_data = notification.model_dump()
            for field, value in update_data.items():
                setattr(db_notification, field, value)
        else:
            # Create new notification
            db_notification = Notification(**notification.model_dump())
            db.add(db_notification)
        
        db.commit()
        db.refresh(db_notification)
        return db_notification
    
    @staticmethod
    def delete_notification(db: Session, user_id: uuid.UUID) -> bool:
        db_notification = db.query(Notification).filter(
            Notification.user_id == user_id
        ).first()
        if db_notification:
            db.delete(db_notification)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_notifications_to_send(db: Session, hours_ago: int) -> List[Notification]:
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_ago)
        return (
            db.query(Notification)
            .options(joinedload(Notification.coin).joinedload(Coin.price))
            .filter(Notification.last_sent_at < cutoff_time)
            .all()
        )