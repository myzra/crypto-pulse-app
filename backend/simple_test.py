#!/usr/bin/env python3
"""
Simple database connection test
Quick way to verify your database connection is working.
"""

import asyncio
from app.database import init_db, close_db, get_db
from app.models.models import Coin
from sqlalchemy import text

async def simple_test():
    """Simple connection and query test"""
    print("🔗 Testing database connection...")
    
    try:
        # Test connection
        await init_db()
        print("✅ Database connection successful!")
        
        # Test a simple query
        print("\n🔍 Testing database query...")
        db = next(get_db())
        
        try:
            # Test with a simple SELECT 1
            result = db.execute(text("SELECT 1 as test")).fetchone()
            print(f"✅ Basic query successful: {result[0]}")
            
            # Test counting coins
            coin_count = db.query(Coin).count()
            print(f"✅ Found {coin_count} coins in database")
            
            # Test getting first 3 coins
            coins = db.query(Coin).limit(3).all()
            print(f"✅ Sample coins:")
            for coin in coins:
                print(f"   - {coin.name} ({coin.symbol})")
                
        finally:
            db.close()
            
        # Close connection
        await close_db()
        print("\n🎉 All tests passed! Your database is working correctly.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Check your database connection settings.")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(simple_test())