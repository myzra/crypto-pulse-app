# scheduler/price_scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.services.price_service import update_all_coin_prices
import logging

logger = logging.getLogger(__name__)

class PriceScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        
    def start(self):
        """Start the price update scheduler"""
        try:
            # Update prices every 5 minutes (CoinGecko free tier limit)
            self.scheduler.add_job(
                update_all_coin_prices,
                trigger=IntervalTrigger(minutes=5),
                id='update_coin_prices',
                name='Update cryptocurrency prices',
                replace_existing=True
            )
            
            # Also run once at startup
            self.scheduler.add_job(
                update_all_coin_prices,
                trigger='date',
                id='initial_price_update',
                name='Initial price update on startup'
            )
            
            self.scheduler.start()
            logger.info("Price scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start price scheduler: {str(e)}")
            raise
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Price scheduler stopped")

# Initialize scheduler instance
price_scheduler = PriceScheduler()

# Add this to your main.py or app startup
def start_background_tasks():
    """Call this in your FastAPI startup event"""
    price_scheduler.start()

def stop_background_tasks():
    """Call this in your FastAPI shutdown event"""
    price_scheduler.stop()