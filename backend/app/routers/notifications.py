from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, validator
from datetime import datetime, time
from typing import Optional
import uuid

from app.database import get_db
from app.models.models import Notification, User, Coin

router = APIRouter(tags=["notifications"])

class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    coin_id: int
    frequency_type: str
    interval_hours: Optional[int] = None
    preferred_time: Optional[str] = None  # Time as string "HH:MM"
    preferred_day: Optional[str] = None   # Day name as string
    
    @validator('frequency_type')
    def validate_frequency_type(cls, v):
        allowed_frequencies = ['hourly', 'daily', 'weekly', 'custom']
        if v.lower() not in allowed_frequencies:
            raise ValueError(f'frequency_type must be one of: {", ".join(allowed_frequencies)}')
        return v.lower()
    
    @validator('interval_hours')
    def validate_interval_hours(cls, v, values):
        if 'frequency_type' in values and values['frequency_type'] == 'custom':
            if v is None or v <= 0:
                raise ValueError('interval_hours is required and must be positive for custom frequency')
            if v > 168:  # 1 week in hours
                raise ValueError('interval_hours cannot exceed 168 hours (1 week)')
        return v
    
    @validator('preferred_time')
    def validate_preferred_time(cls, v, values):
        if v is not None:
            try:
                # Validate time format HH:MM
                time_obj = datetime.strptime(v, '%H:%M').time()
                return v
            except ValueError:
                raise ValueError('preferred_time must be in HH:MM format')
        return v
    
    @validator('preferred_day')
    def validate_preferred_day(cls, v):
        if v is not None:
            allowed_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            if v.lower() not in allowed_days:
                raise ValueError(f'preferred_day must be one of: {", ".join(allowed_days)}')
        return v

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    coin_id: int
    frequency_type: str
    interval_hours: Optional[int]
    preferred_time: Optional[time]  # Changed from datetime to time
    preferred_day: Optional[int]
    is_active: bool
    created_at: datetime
    next_scheduled_at: Optional[datetime]
    
    class Config:
        from_attributes = True

def convert_day_name_to_number(day_name: str) -> int:
    """Convert day name to number (0=Monday, 6=Sunday)"""
    days_map = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }
    return days_map.get(day_name.lower(), 0)

def calculate_next_scheduled_time(
    frequency_type: str,
    interval_hours: Optional[int] = None,
    preferred_time_str: Optional[str] = None,
    preferred_day: Optional[str] = None
) -> Optional[datetime]:
    """Calculate the next scheduled notification time"""
    now = datetime.utcnow()
    
    if frequency_type == 'hourly':
        return now.replace(minute=0, second=0, microsecond=0)
    
    elif frequency_type == 'custom' and interval_hours:
        from datetime import timedelta
        return now + timedelta(hours=interval_hours)
    
    elif frequency_type == 'daily' and preferred_time_str:
        # Parse preferred time
        preferred_time_obj = datetime.strptime(preferred_time_str, '%H:%M').time()
        next_time = datetime.combine(now.date(), preferred_time_obj)
        
        # If the time has already passed today, schedule for tomorrow
        if next_time <= now:
            from datetime import timedelta
            next_time += timedelta(days=1)
        
        return next_time
    
    elif frequency_type == 'weekly' and preferred_time_str and preferred_day:
        from datetime import timedelta
        
        # Parse preferred time
        preferred_time_obj = datetime.strptime(preferred_time_str, '%H:%M').time()
        preferred_day_num = convert_day_name_to_number(preferred_day)
        
        # Calculate days until preferred day
        current_weekday = now.weekday()  # Monday is 0
        days_ahead = preferred_day_num - current_weekday
        
        if days_ahead < 0:  # Target day has already happened this week
            days_ahead += 7
        elif days_ahead == 0:  # Target day is today
            next_time = datetime.combine(now.date(), preferred_time_obj)
            if next_time <= now:  # Time has already passed today
                days_ahead = 7
        
        if days_ahead == 0:
            next_time = datetime.combine(now.date(), preferred_time_obj)
        else:
            next_date = now.date() + timedelta(days=days_ahead)
            next_time = datetime.combine(next_date, preferred_time_obj)
        
        return next_time
    
    return None

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db)
):
    """Create a new notification for a user and coin"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == notification_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify coin exists
    coin = db.query(Coin).filter(Coin.id == notification_data.coin_id).first()
    if not coin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coin not found"
        )
    
    # Check if user already has a notification for this coin
    existing_notification = db.query(Notification).filter(
        Notification.user_id == notification_data.user_id,
        Notification.coin_id == notification_data.coin_id,
        Notification.is_active == True
    ).first()
    
    if existing_notification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active notification for this coin already exists"
        )
    
    # Convert preferred_time string to datetime object if provided
    preferred_time_obj = None
    if notification_data.preferred_time:
        # Convert "HH:MM" to a datetime object (using epoch date)
        time_obj = datetime.strptime(notification_data.preferred_time, '%H:%M').time()
        preferred_time_obj = datetime.combine(datetime(1970, 1, 1).date(), time_obj)
    
    # Convert preferred_day string to number if provided
    preferred_day_num = None
    if notification_data.preferred_day:
        preferred_day_num = convert_day_name_to_number(notification_data.preferred_day)
    
    # Calculate next scheduled time
    next_scheduled_at = calculate_next_scheduled_time(
        notification_data.frequency_type,
        notification_data.interval_hours,
        notification_data.preferred_time,
        notification_data.preferred_day
    )
    
    # Create notification
    db_notification = Notification(
        user_id=notification_data.user_id,
        coin_id=notification_data.coin_id,
        frequency_type=notification_data.frequency_type,
        interval_hours=notification_data.interval_hours,
        preferred_time=preferred_time_obj,
        preferred_day=preferred_day_num,
        next_scheduled_at=next_scheduled_at,
        is_active=True
    )
    
    try:
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create notification. Please check your input data."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the notification"
        )

@router.get("/{user_id}", response_model=list[NotificationResponse])
def get_user_notifications(
    user_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get all active notifications for a user"""
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_active == True
    ).all()
    
    return notifications

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a notification"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Soft delete by setting is_active to False
    notification.is_active = False
    db.commit()
    
    return None