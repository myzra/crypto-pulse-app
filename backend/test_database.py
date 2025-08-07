#!/usr/bin/env python3
"""
Database connection and functionality tests
Run this script to verify your database setup is working correctly.
"""

import asyncio
import sys
import traceback
from decimal import Decimal
from datetime import datetime
import uuid

# Add your app directory to path if needed
# sys.path.append('path/to/your/app')

from app.database import init_db, close_db, get_db, check_db_health, engine
from app.models.models import User, Coin, CoinPrice, Favorite, Log, Notification
from app.crud.crud import UserCRUD, CoinCRUD, CoinPriceCRUD, FavoriteCRUD, LogCRUD, NotificationCRUD
from app.schemas.schemas import CoinCreate, CoinPriceCreate, FavoriteCreate, LogCreate, NotificationCreate
from sqlalchemy import text
from sqlalchemy.orm import Session

class DatabaseTester:
    def __init__(self):
        self.test_results = []
        self.test_data = {}

    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.test_results.append((test_name, success, message))

    async def test_basic_connection(self):
        """Test basic database connection"""
        try:
            await init_db()
            self.log_test("Basic Connection", True, "Connected to Supabase")
            return True
        except Exception as e:
            self.log_test("Basic Connection", False, str(e))
            return False

    async def test_health_check(self):
        """Test database health check"""
        try:
            is_healthy = await check_db_health()
            self.log_test("Health Check", is_healthy, "Database responsive" if is_healthy else "Database not responsive")
            return is_healthy
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_table_existence(self):
        """Test if all required tables exist"""
        try:
            with engine.connect() as conn:
                # Check public schema tables
                public_tables = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('coins', 'coin_prices', 'favorites', 'logs', 'notifications')
                """)).fetchall()
                
                # Check auth schema tables
                auth_tables = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'auth' 
                    AND table_name = 'users'
                """)).fetchall()

                public_table_names = [row[0] for row in public_tables]
                auth_table_names = [row[0] for row in auth_tables]
                
                expected_public = ['coins', 'coin_prices', 'favorites', 'logs', 'notifications']
                expected_auth = ['users']
                
                missing_public = set(expected_public) - set(public_table_names)
                missing_auth = set(expected_auth) - set(auth_table_names)
                
                if not missing_public and not missing_auth:
                    self.log_test("Table Existence", True, f"All tables found: {len(public_table_names) + len(auth_table_names)} tables")
                    return True
                else:
                    missing = list(missing_public) + list(missing_auth)
                    self.log_test("Table Existence", False, f"Missing tables: {missing}")
                    return False
                    
        except Exception as e:
            self.log_test("Table Existence", False, str(e))
            return False

    def test_crud_operations(self):
        """Test CRUD operations on each model"""
        try:
            db = next(get_db())
            
            # Test Coin CRUD
            test_coin = CoinCreate(
                name="Test Bitcoin",
                symbol="TESTBTC",
                color="#FF9500"
            )
            
            # Create coin
            created_coin = CoinCRUD.create_coin(db, test_coin)
            self.test_data['coin_id'] = created_coin.id
            self.log_test("Create Coin", True, f"Created coin with ID: {created_coin.id}")
            
            # Read coin
            retrieved_coin = CoinCRUD.get_coin(db, created_coin.id)
            self.log_test("Read Coin", retrieved_coin is not None, f"Retrieved coin: {retrieved_coin.name if retrieved_coin else 'None'}")
            
            # Test CoinPrice CRUD
            test_price = CoinPriceCreate(
                coin_id=created_coin.id,
                price=Decimal("50000.50"),
                change=Decimal("1.5"),
                is_positive=True
            )
            
            created_price = CoinPriceCRUD.create_or_update_coin_price(db, test_price)
            self.log_test("Create Coin Price", True, f"Created price: ${created_price.price}")
            
            # Test getting coins with prices
            coins_with_prices = CoinCRUD.get_coins_with_prices(db, limit=5)
            self.log_test("Get Coins with Prices", len(coins_with_prices) > 0, f"Found {len(coins_with_prices)} coins with prices")
            
            return True
            
        except Exception as e:
            self.log_test("CRUD Operations", False, str(e))
            return False
        finally:
            db.close()

    def test_relationships(self):
        """Test database relationships and foreign keys"""
        try:
            db = next(get_db())
            
            # Get a coin to test with
            coin = CoinCRUD.get_coin(db, self.test_data.get('coin_id', 1))
            if not coin:
                self.log_test("Relationships", False, "No coin found for relationship testing")
                return False
            
            # Test that coin has price relationship
            if hasattr(coin, 'price') and coin.price:
                self.log_test("Coin-Price Relationship", True, f"Coin {coin.name} has price ${coin.price.price}")
            else:
                self.log_test("Coin-Price Relationship", False, "Coin price relationship not working")
            
            return True
            
        except Exception as e:
            self.log_test("Relationships", False, str(e))
            return False
        finally:
            db.close()

    def test_queries(self):
        """Test various database queries"""
        try:
            db = next(get_db())
            
            # Test basic queries
            coins = CoinCRUD.get_coins(db, limit=5)
            self.log_test("Get Coins Query", len(coins) >= 0, f"Retrieved {len(coins)} coins")
            
            # Test query with filters
            if coins:
                coin_by_symbol = CoinCRUD.get_coin_by_symbol(db, coins[0].symbol)
                self.log_test("Get Coin by Symbol", coin_by_symbol is not None, f"Found coin by symbol: {coins[0].symbol}")
            
            return True
            
        except Exception as e:
            self.log_test("Database Queries", False, str(e))
            return False
        finally:
            db.close()

    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        try:
            db = next(get_db())
            
            # Clean up test coin and related data
            if 'coin_id' in self.test_data:
                coin_id = self.test_data['coin_id']
                
                # Delete price first (due to foreign key)
                CoinPriceCRUD.delete_coin_price(db, coin_id)
                
                # Delete coin
                CoinCRUD.delete_coin(db, coin_id)
                
                self.log_test("Cleanup", True, "Test data cleaned up successfully")
            
        except Exception as e:
            self.log_test("Cleanup", False, str(e))
        finally:
            db.close()

    async def run_all_tests(self):
        """Run all database tests"""
        print("🧪 Starting Database Tests\n" + "="*50)
        
        # Test connection first
        connection_ok = await self.test_basic_connection()
        if not connection_ok:
            print("❌ Connection failed - stopping tests")
            return False
        
        # Run other tests
        await self.test_health_check()
        self.test_table_existence()
        self.test_crud_operations()
        self.test_relationships()
        self.test_queries()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Close connection
        await close_db()
        
        # Summary
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        print("\n" + "="*50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Your database setup is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the errors above.")
            failed_tests = [name for name, success, _ in self.test_results if not success]
            print(f"Failed tests: {', '.join(failed_tests)}")
        
        return passed == total

async def main():
    """Main test function"""
    tester = DatabaseTester()
    success = await tester.run_all_tests()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())