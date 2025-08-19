from sqlalchemy import Column, Integer, BigInteger, String, Text, Numeric, Boolean, DateTime, UUID, ForeignKey, Index, CheckConstraint, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instance_id = Column(UUID(as_uuid=True), nullable=True)
    aud = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    encrypted_password = Column(String(255), nullable=True)
    email_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    confirmation_token = Column(String(255), nullable=True)
    confirmation_sent_at = Column(DateTime(timezone=True), nullable=True)
    recovery_token = Column(String(255), nullable=True)
    recovery_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_change_token_new = Column(String(255), nullable=True)
    email_change = Column(String(255), nullable=True)
    email_change_sent_at = Column(DateTime(timezone=True), nullable=True)
    last_sign_in_at = Column(DateTime(timezone=True), nullable=True)
    raw_app_meta_data = Column(JSON, nullable=True)
    raw_user_meta_data = Column(JSON, nullable=True)
    is_super_admin = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    phone = Column(Text, nullable=True)
    phone_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    phone_change = Column(Text, nullable=True, default="")
    phone_change_token = Column(String(255), nullable=True, default="")
    phone_change_sent_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = column_property(None, deferred=True)
    email_change_token_current = Column(String(255), nullable=True, default="")
    email_change_confirm_status = Column(Integer, nullable=True, default=0)
    banned_until = Column(DateTime(timezone=True), nullable=True)
    reauthentication_token = Column(String(255), nullable=True, default="")
    reauthentication_sent_at = Column(DateTime(timezone=True), nullable=True)
    is_sso_user = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    is_anonymous = Column(Boolean, nullable=False, default=False)
    
    # Relationships - using string references to avoid circular imports
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Coin(Base):
    __tablename__ = "coins"
    __table_args__ = {"schema": "public"}
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    symbol = Column(Text, nullable=False, unique=True)
    color = Column(Text, nullable=False)
    
    # Relationships - using string references to avoid circular imports
    price = relationship("CoinPrice", back_populates="coin", uselist=False, cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="coin", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="coin", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="coin", cascade="all, delete-orphan")

class CoinPrice(Base):
    __tablename__ = "coin_prices"
    __table_args__ = {"schema": "public"}
    
    coin_id = Column(BigInteger, ForeignKey("public.coins.id", onupdate="CASCADE", ondelete="CASCADE"), primary_key=True)
    price = Column(Numeric, nullable=False)
    change = Column(Numeric, nullable=True)
    is_positive = Column(Boolean, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, default=func.now())
    
    # Relationships - using string references to avoid circular imports
    coin = relationship("Coin", back_populates="price")

class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = {"schema": "public"}
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), primary_key=True)
    coin_id = Column(BigInteger, ForeignKey("public.coins.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), nullable=True, default=func.now())
    
    # Relationships - using string references to avoid circular imports
    user = relationship("User", back_populates="favorites")
    coin = relationship("Coin", back_populates="favorites")

class Log(Base):
    __tablename__ = "logs"
    __table_args__ = {"schema": "public"}
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    coin_id = Column(BigInteger, ForeignKey("public.coins.id", ondelete="CASCADE"), nullable=True)
    notified_at = Column(DateTime(timezone=True), nullable=True, default=func.now())
    price = Column(Numeric, nullable=False)
    change_percent = Column(Numeric, nullable=True)
    message = Column(Text, nullable=True)
    
    # Relationships - using string references to avoid circular imports
    user = relationship("User", back_populates="logs")
    coin = relationship("Coin", back_populates="logs")

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id", ondelete="CASCADE"), nullable=False)
    coin_id = Column(BigInteger, ForeignKey("public.coins.id", ondelete="CASCADE"), nullable=False)
    frequency_type = Column(
        String(20), 
        nullable=False
    )
    interval_hours = Column(Integer, nullable=True)
    preferred_time = Column(DateTime(timezone=False), nullable=True)
    preferred_day = Column(Integer, nullable=True)

    is_active = Column(Boolean, default=True)
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    next_scheduled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="notifications")
    coin = relationship("Coin", back_populates="notifications")
