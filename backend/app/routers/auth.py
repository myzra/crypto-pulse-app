from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from typing import Optional
import bcrypt

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse, UserSignIn, Token
from app.crud.crud import UserCRUD

router = APIRouter()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/signup", response_model=dict)
async def sign_up(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = UserCRUD.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # Create user object with Supabase auth schema fields
        db_user = User(
            id=uuid.uuid4(),
            email=user_data.email,
            encrypted_password=hashed_password,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            email_confirmed_at=datetime.now(timezone.utc),  # Auto-confirm for now
            role="authenticated",
            aud="authenticated",
            raw_user_meta_data={"username": user_data.username} if hasattr(user_data, 'username') else {},
            raw_app_meta_data={}
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "message": "User created successfully",
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "username": db_user.raw_user_meta_data.get("username") if db_user.raw_user_meta_data else None
            }
        }
        
    except Exception as e:
        db.rollback()
        if "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/signin", response_model=dict)
async def sign_in(user_credentials: UserSignIn, db: Session = Depends(get_db)):
    """Authenticate user"""
    try:
        # Find user by email
        user = UserCRUD.get_user_by_email(db, user_credentials.email)
        
        if not user or not user.encrypted_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user_credentials.password, user.encrypted_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last sign in
        user.last_sign_in_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return {
            "message": "Sign in successful",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.raw_user_meta_data.get("username") if user.raw_user_meta_data else None,
                "last_sign_in_at": user.last_sign_in_at.isoformat() if user.last_sign_in_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during sign in: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=dict)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID"""
    try:
        user_uuid = uuid.UUID(user_id)
        user = UserCRUD.get_user(db, user_uuid)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.raw_user_meta_data.get("username") if user.raw_user_meta_data else None,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_sign_in_at": user.last_sign_in_at.isoformat() if user.last_sign_in_at else None
            }
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )