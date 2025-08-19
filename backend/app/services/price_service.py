# services/price_service.py
import requests
import asyncio
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Coin, CoinPrice
from decimal import Decimal
import logging
from sqlalchemy import func

logger = logging.getLogger(__name__)

class CoinGeckoPriceService:
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Mapping of your symbols to CoinGecko IDs
    SYMBOL_TO_GECKO_ID = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether', 
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'USDC': 'usd-coin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'TRX': 'tron',
        'AVAX': 'avalanche-2',
        'SHIB': 'shiba-inu',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'BCH': 'bitcoin-cash',
        'NEAR': 'near',
        'MATIC': 'matic-network',
        'LTC': 'litecoin',
        'ICP': 'internet-computer',
        'UNI': 'uniswap',
        'DAI': 'dai',
        'ATOM': 'cosmos',
        'XLM': 'stellar',
        'XMR': 'monero',
        'ETC': 'ethereum-classic',
        'HBAR': 'hedera-hashgraph',
        'FIL': 'filecoin',
        'APT': 'aptos',
        'ARB': 'arbitrum',
        'HYPE': 'hyperliquid'
    }
    
    @classmethod
    async def fetch_prices_for_all_coins(cls, db: Session):
        """Fetch prices for all coins in database from CoinGecko"""
        try:
            # Get all coins from database
            coins = db.query(Coin).all()
            
            if not coins:
                logger.info("No coins found in database")
                return
            
            # Prepare CoinGecko API call
            gecko_ids = []
            coin_map = {}
            
            for coin in coins:
                gecko_id = cls.SYMBOL_TO_GECKO_ID.get(coin.symbol.upper())
                if gecko_id:
                    gecko_ids.append(gecko_id)
                    coin_map[gecko_id] = coin
                else:
                    logger.warning(f"No CoinGecko mapping for symbol: {coin.symbol}")
            
            if not gecko_ids:
                logger.warning("No valid CoinGecko IDs found")
                return
            
            # Fetch prices from CoinGecko
            prices_data = await cls._fetch_from_coingecko(gecko_ids)
            
            # Update database
            updated_count = 0
            for gecko_id, price_info in prices_data.items():
                coin = coin_map.get(gecko_id)
                if coin:
                    await cls._update_coin_price(db, coin, price_info)
                    updated_count += 1
            
            db.commit()
            logger.info(f"Successfully updated prices for {updated_count} coins")
            
        except Exception as e:
            logger.error(f"Error fetching prices: {str(e)}")
            db.rollback()
            raise
    
    @classmethod
    async def _fetch_from_coingecko(cls, gecko_ids: list) -> dict:
        """Fetch price data from CoinGecko API"""
        try:
            ids_str = ','.join(gecko_ids)
            url = f"{cls.BASE_URL}/simple/price"
            params = {
                'ids': ids_str,
                'vs_currencies': 'usd',
                'include_24hr_change': 'true'
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"CoinGecko API error: {str(e)}")
            raise
    
    @classmethod
    async def _update_coin_price(cls, db: Session, coin: Coin, price_info: dict):
        """Update or create coin price record"""
        try:
            current_price = price_info.get('usd')
            price_change_24h = price_info.get('usd_24h_change')
            
            if current_price is None:
                logger.warning(f"No price data for coin {coin.symbol}")
                return
            
            # Check if price record exists
            existing_price = db.query(CoinPrice).filter(
                CoinPrice.coin_id == coin.id
            ).first()
            
            if existing_price:
                # Update existing record
                existing_price.price = Decimal(str(current_price))
                existing_price.change = Decimal(str(price_change_24h)) if price_change_24h else None
                existing_price.is_positive = price_change_24h > 0 if price_change_24h is not None else None
                existing_price.updated_at = func.now()
            else:
                # Create new record
                new_price = CoinPrice(
                    coin_id=coin.id,
                    price=Decimal(str(current_price)),
                    change=Decimal(str(price_change_24h)) if price_change_24h else None,
                    is_positive=price_change_24h > 0 if price_change_24h is not None else None
                )
                db.add(new_price)
                
            logger.info(f"Updated price for {coin.symbol}: ${current_price}")
            
        except Exception as e:
            logger.error(f"Error updating price for {coin.symbol}: {str(e)}")
            raise

# Scheduler function to run periodically
async def update_all_coin_prices():
    """Function to be called by scheduler"""
    db = next(get_db())
    try:
        await CoinGeckoPriceService.fetch_prices_for_all_coins(db)
    finally:
        db.close()

# Manual endpoint for testing
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

@router.post("/update-prices")
async def manually_update_prices(db: Session = Depends(get_db)):
    """Manually trigger price updates (for testing)"""
    try:
        await CoinGeckoPriceService.fetch_prices_for_all_coins(db)
        return {"message": "Prices updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))