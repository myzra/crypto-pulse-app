from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from typing import Generator
from app.config import settings

# Create Base class
Base = declarative_base()

# SQLAlchemy engine - optimized for Supabase PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    echo=settings.ENVIRONMENT == "development",
    # Additional Supabase optimizations
    connect_args={
        "application_name": "fastapi_app",
        "options": "-c timezone=UTC"
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def init_db():
    """Initialize database connection and verify schema"""
    try:
        with engine.connect() as conn:
            # Test basic connection
            conn.execute(text("SELECT 1"))
            
            # Verify important tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema IN ('public', 'auth') 
                AND table_name IN ('users', 'coins', 'coin_prices', 'favorites', 'logs', 'notifications')
            """))
            
            existing_tables = [row[0] for row in result]
            expected_tables = ['users', 'coins', 'coin_prices', 'favorites', 'logs', 'notifications']
            missing_tables = set(expected_tables) - set(existing_tables)
            
            if missing_tables:
                print(f"Warning: Missing tables: {missing_tables}")
            else:
                print("✓ All required tables found")
                
        print("✓ Database connected successfully to Supabase")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise

async def close_db():
    """Close database connection"""
    try:
        engine.dispose()
        print("✓ Database disconnected gracefully")
    except Exception as e:
        print(f"Warning: Error during database disconnect: {e}")

def get_db() -> Generator:
    """
    Database dependency for FastAPI routes.
    Creates a new database session for each request and closes it when done.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

# Health check function
async def check_db_health() -> bool:
    """Check if database is healthy and responsive"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False