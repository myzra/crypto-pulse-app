#!/usr/bin/env python3
"""
Notification Scheduler Worker - Cron job to process overdue notifications
Runs every 5 minutes to check for and process overdue notifications
"""

import logging
import time
import requests
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

# Import your app modules
from app.database import get_db
from app.models.models import Notification, User, Coin, UserPushToken, Log

# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_overdue_notifications(db: Session) -> List[Notification]:
    """Get all active notifications that are overdue"""
    now = datetime.now(timezone.utc)
    
    # Add debug logging
    logger.info(f"Current UTC time: {now}")
    logger.info(f"Looking for notifications with next_scheduled_at <= {now}")
    
    overdue_notifications = db.query(Notification).filter(
        Notification.is_active == True,
        Notification.next_scheduled_at <= now
    ).all()
    
    # Debug: Log all notifications and their scheduled times
    all_notifications = db.query(Notification).filter(
        Notification.is_active == True
    ).all()
    
    for notif in all_notifications:
        scheduled_time = notif.next_scheduled_at
        is_overdue = scheduled_time <= now if scheduled_time else False
        logger.info(f"Notification {notif.id}: scheduled_at={scheduled_time}, is_overdue={is_overdue}")
    
    logger.info(f"Found {len(overdue_notifications)} overdue notifications")
    return overdue_notifications

def calculate_next_scheduled_time(
    frequency_type: str,
    interval_hours: int = None,
    preferred_time_str: str = None,
    preferred_day: str = None
) -> datetime:
    """Calculate the next scheduled notification time with proper timezone handling"""
    now = datetime.now(timezone.utc)
    
    if frequency_type == 'hourly':
        # Set to next full hour
        next_hour = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        return next_hour
    
    elif frequency_type == 'custom' and interval_hours:
        next_time = now + timedelta(hours=interval_hours)
        return next_time
    
    elif frequency_type == 'daily' and preferred_time_str:
        # Parse preferred time
        preferred_time_obj = datetime.strptime(preferred_time_str, '%H:%M').time()
        
        # Create datetime for today at preferred time (UTC)
        today_preferred = datetime.combine(now.date(), preferred_time_obj, tzinfo=timezone.utc)
        
        # If the time has already passed today, schedule for tomorrow
        if today_preferred <= now:
            next_time = today_preferred + timedelta(days=1)
        else:
            next_time = today_preferred
            
        return next_time
    
    elif frequency_type == 'weekly' and preferred_time_str and preferred_day:
        # Parse preferred time
        preferred_time_obj = datetime.strptime(preferred_time_str, '%H:%M').time()
        preferred_day_num = convert_day_name_to_number(preferred_day) if isinstance(preferred_day, str) else preferred_day
        
        # Calculate days until preferred day
        current_weekday = now.weekday()  # Monday is 0
        days_ahead = preferred_day_num - current_weekday
        
        if days_ahead <= 0:  # Target day has already happened this week or is today
            days_ahead += 7
        
        next_date = now.date() + timedelta(days=days_ahead)
        next_time = datetime.combine(next_date, preferred_time_obj, tzinfo=timezone.utc)

        return next_time
    
    # Fallback - schedule for 1 hour from now
    fallback_time = now + timedelta(hours=1)
    return fallback_time.replace(tzinfo=timezone.utc)

def convert_day_name_to_number(day_name) -> int:
    """Convert day name to number (0=Monday, 6=Sunday) - handles both string and int"""
    if isinstance(day_name, int):
        return day_name
    
    if isinstance(day_name, str):
        days_map = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6
        }
        return days_map.get(day_name.lower(), 0)
    
    return 0

def debug_notification_times():
    """Debug function to check all notification times"""
    logger.info("=== NOTIFICATION TIME DEBUG ===")
    
    try:
        db = next(get_db())
        
        try:
            now = datetime.now(timezone.utc)
            logger.info(f"Current UTC time: {now}")
            
            # Get all active notifications
            all_notifications = db.query(Notification).filter(
                Notification.is_active == True
            ).all()
            
            logger.info(f"Found {len(all_notifications)} active notifications:")
            
            for i, notif in enumerate(all_notifications):
                scheduled_time = notif.next_scheduled_at
                
                # Check if scheduled_time has timezone info
                if scheduled_time:
                    if scheduled_time.tzinfo is None:
                        # No timezone info - assume UTC
                        scheduled_time_utc = scheduled_time.replace(tzinfo=timezone.utc)
                        logger.warning(f"Notification {notif.id} has no timezone info, assuming UTC")
                    else:
                        scheduled_time_utc = scheduled_time.astimezone(timezone.utc)
                    
                    time_diff = (scheduled_time_utc - now).total_seconds() / 60  # difference in minutes
                    is_overdue = scheduled_time_utc <= now
                    
                    logger.info(f"  [{i}] ID: {notif.id}")
                    logger.info(f"      Frequency: {notif.frequency_type}")
                    logger.info(f"      Scheduled: {scheduled_time}")
                    logger.info(f"      Scheduled UTC: {scheduled_time_utc}")
                    logger.info(f"      Time diff: {time_diff:.1f} minutes")
                    logger.info(f"      Is overdue: {is_overdue}")
                    logger.info(f"      Last sent: {notif.last_sent_at}")
                else:
                    logger.info(f"  [{i}] ID: {notif.id} - NO SCHEDULED TIME")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in debug function: {str(e)}")

# Add this to your main function for debugging
def process_overdue_notifications_with_debug():
    """Main function to process all overdue notifications with debug info"""
    logger.info("Starting notification scheduler check...")
    
    # Add debug info
    debug_notification_times()
    
    try:
        # Get database session
        db = next(get_db())
        
        try:
            # Get all overdue notifications
            overdue_notifications = get_overdue_notifications(db)
            
            if not overdue_notifications:
                logger.info("No overdue notifications found")
                return
            
            logger.info(f"Found {len(overdue_notifications)} overdue notifications")
            
            # Process each overdue notification
            for notification in overdue_notifications:
                try:
                    logger.info(f"Processing notification {notification.id} for user {notification.user_id}")
                    
                    # Send notification to client
                    success = send_notification_to_client(notification, db)
                    
                    if success:
                        # Update notification schedule
                        update_notification_schedule(notification, db)
                        
                        # Commit changes for this notification
                        db.commit()
                        
                        logger.info(f"Successfully processed notification {notification.id}")
                    else:
                        logger.error(f"Failed to send notification {notification.id}")
                        db.rollback()
                    
                except Exception as e:
                    logger.error(f"Error processing notification {notification.id}: {str(e)}")
                    db.rollback()
                    continue
            
        finally:
            db.close()
            
    except SQLAlchemyError as e:
        logger.error(f"Database error in notification scheduler: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in notification scheduler: {str(e)}")

def send_notification_to_client(notification: Notification, db: Session):
    """
    Send notification to React Native Expo client
    Sends push notification via Expo Push API
    """
    try:
        # Get user and coin data for the notification
        user = db.query(User).filter(User.id == notification.user_id).first()
        coin = db.query(Coin).filter(Coin.id == notification.coin_id).first()
        
        if not user:
            logger.error(f"User not found for notification {notification.id}")
            return False
            
        if not coin:
            logger.error(f"Coin not found for notification {notification.id}")
            return False
        
        # Get user's push token
        push_token_record = db.query(UserPushToken).filter(
            UserPushToken.user_id == notification.user_id
        ).first()
        
        if not push_token_record:
            logger.warning(f"No push token found for user {notification.user_id}")
            return False
            
        # Get current coin price for the notification
        coin_price = None
        current_price = "N/A"
        price_change = "N/A"
        
        if coin.price:  # Assuming coin has a price relationship
            coin_price = coin.price
            current_price = f"${float(coin_price.price):,.2f}"
            if coin_price.change is not None:
                change_symbol = "📈" if coin_price.is_positive else "📉"
                price_change = f"{change_symbol} {float(coin_price.change):+.2f}%"
        
        # Create notification message
        title = f"{coin.symbol} Price Update"
        body = f"{coin.name} is currently at {current_price}"
        if price_change != "N/A":
            body += f" ({price_change})"
        
        # Prepare the push notification payload
        expo_message = {
            "to": push_token_record.push_token,
            "title": title,
            "body": body,
            "data": {
                "coin_id": coin.id,
                "coin_symbol": coin.symbol,
                "coin_name": coin.name,
                "current_price": float(coin_price.price) if coin_price else None,
                "price_change": float(coin_price.change) if coin_price and coin_price.change else None,
                "is_positive": coin_price.is_positive if coin_price else None,
                "notification_id": str(notification.id),
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "sound": "default",
            "badge": 1,
            "priority": "high"
        }
        
        # Send the notification
        response = send_expo_push_notification(expo_message)
        
        if response and response.get('status') == 'ok':
            log_notification(notification, coin_price, db)
            logger.info(f"Successfully sent notification to user {notification.user_id} for coin {coin.symbol}")
            return True
        else:
            logger.error(f"Failed to send notification: {response}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending notification {notification.id}: {str(e)}")
        return False
    
def send_expo_push_notification(message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Send a push notification via Expo Push API
    
    Args:
        message: The notification message payload
        
    Returns:
        Response from Expo API or None if failed
    """
    expo_url = "https://exp.host/--/api/v2/push/send"
    
    headers = {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
    }
    
    try:
        logger.info(f"Sending push notification to token: {message['to'][:10]}...")
        
        response = requests.post(
            expo_url,
            data=json.dumps(message),
            headers=headers,
            timeout=30
        )
        
        response.raise_for_status()  # Raise an exception for bad status codes
        
        response_data = response.json()
        logger.info(f"Expo API response: {response_data}")
        
        # Check for Expo-specific errors
        if 'data' in response_data and response_data['data']:
            ticket = response_data['data']
            if ticket.get('status') == 'ok':
                return {'status': 'ok', 'data': ticket}
            elif ticket.get('status') == 'error':
                error_details = ticket.get('details', {})
                error_message = error_details.get('error', 'Unknown error')
                logger.error(f"Expo push notification error: {error_message}")
                
                # Handle specific error cases
                if error_message == 'DeviceNotRegistered':
                    logger.warning("Device not registered - token may be invalid")
                elif error_message == 'InvalidCredentials':
                    logger.error("Invalid Expo credentials")
                elif error_message == 'MessageTooBig':
                    logger.error("Notification message too big")
                    
                return {'status': 'error', 'details': error_details}
        
        return response_data
        
    except requests.exceptions.Timeout:
        logger.error("Timeout while sending push notification")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error while sending push notification: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in push notification response: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error sending push notification: {str(e)}")
        return None

def send_batch_expo_notifications(messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Send multiple push notifications in a batch via Expo Push API
    More efficient for sending many notifications at once
    
    Args:
        messages: List of notification message payloads
        
    Returns:
        Response from Expo API or None if failed
    """
    expo_url = "https://exp.host/--/api/v2/push/send"
    
    headers = {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
    }
    
    try:
        logger.info(f"Sending batch of {len(messages)} push notifications")
        
        response = requests.post(
            expo_url,
            data=json.dumps(messages),
            headers=headers,
            timeout=60  # Longer timeout for batch requests
        )
        
        response.raise_for_status()
        
        response_data = response.json()
        logger.info(f"Expo batch API response: {response_data}")
        
        return response_data
        
    except requests.exceptions.Timeout:
        logger.error("Timeout while sending batch push notifications")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error while sending batch push notifications: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in batch push notification response: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error sending batch push notifications: {str(e)}")
        return None

# Helper function to validate Expo push tokens
def is_valid_expo_push_token(token: str) -> bool:
    """
    Validate if a token looks like a valid Expo push token
    
    Args:
        token: The push token to validate
        
    Returns:
        True if token appears valid, False otherwise
    """
    if not token or not isinstance(token, str):
        return False
    
    # Expo push tokens typically start with ExponentPushToken[ or ExpoPushToken[
    # and end with ]
    return (
        (token.startswith('ExponentPushToken[') or token.startswith('ExpoPushToken[')) 
        and token.endswith(']')
        and len(token) > 20  # Reasonable minimum length
    )
        
def update_notification_schedule(notification: Notification, db: Session):
    """Update notification timestamps after processing"""
    now = datetime.now(timezone.utc)
    
    # Convert preferred_day back to string for calculation
    preferred_day_str = None
    if notification.preferred_day is not None:
        day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        preferred_day_str = day_names[notification.preferred_day]
    
    # Convert preferred_time back to string for calculation
    preferred_time_str = None
    if notification.preferred_time:
        preferred_time_str = notification.preferred_time.strftime('%H:%M')
    
    # Calculate next scheduled time
    next_scheduled_at = calculate_next_scheduled_time(
        notification.frequency_type,
        notification.interval_hours,
        preferred_time_str,
        preferred_day_str
    )
    
    # Use db.query().update() instead of object modification
    db.query(Notification).filter(Notification.id == notification.id).update({
        'last_sent_at': now,
        'next_scheduled_at': next_scheduled_at,
        'updated_at': now
    })
    
    logger.info(f"Updated notification {notification.id} - next scheduled: {next_scheduled_at}")

def process_overdue_notifications():
    """Main function to process all overdue notifications"""
    logger.info("Starting notification scheduler check...")
    
    try:
        # Get database session
        db = next(get_db())
        
        try:
            # Get all overdue notifications
            overdue_notifications = get_overdue_notifications(db)
            
            if not overdue_notifications:
                logger.info("No overdue notifications found")
                return
            
            logger.info(f"Found {len(overdue_notifications)} overdue notifications")
            
            # Process each overdue notification
            for notification in overdue_notifications:
                try:
                    # Send notification to client (TODO: implement)
                    send_notification_to_client(notification, db)
                    
                    # Update notification schedule
                    update_notification_schedule(notification, db)
                    
                    # Commit changes for this notification
                    db.commit()
                    
                    logger.info(f"Successfully processed notification {notification.id}")
                    
                except Exception as e:
                    logger.error(f"Error processing notification {notification.id}: {str(e)}")
                    db.rollback()
                    continue
            
        finally:
            db.close()
            
    except SQLAlchemyError as e:
        logger.error(f"Database error in notification scheduler: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in notification scheduler: {str(e)}")
        
def log_notification(notification: Notification, coin_price, db: Session):
    """Store notification in logs table"""
    try:
        log_entry = Log(
            user_id=notification.user_id,
            coin_id=notification.coin_id,
            price=float(coin_price.price) if coin_price else 0,
            change_percent=float(coin_price.change) if coin_price and coin_price.change else None,
            message=f"Push notification sent for {notification.coin.symbol}"
        )
        db.add(log_entry)
        logger.info(f"Logged notification for user {notification.user_id}")
    except Exception as e:
        logger.error(f"Error logging notification: {str(e)}")

def main():
    """Main entry point for the cron job"""
    logger.info("Notification scheduler worker started")
    
    # For cron job - run once and exit
    process_overdue_notifications_with_debug()
    
    logger.info("Notification scheduler worker completed")

def run_continuous():
    """Run the scheduler continuously every 5 minutes (for testing)"""
    logger.info("Starting continuous notification scheduler...")
    
    while True:
        try:
            process_overdue_notifications()
            logger.info("Sleeping for 5 minutes...")
            time.sleep(300)  # 5 minutes
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error in continuous mode: {str(e)}")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        run_continuous()
    else:
        main()