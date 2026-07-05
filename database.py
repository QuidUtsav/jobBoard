from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind = engine)
Base = declarative_base()

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50),nullable=False)
    email = Column(String(255),unique=True, nullable=False)
    hashed_password = Column(String(255),nullable=False)
    role =Column(String(20),nullable=False)

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True)
    title=Column(String(100),nullable=False)
    content=Column(String(1000),nullable=False)
    created_at =Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    author_id = Column(Integer, ForeignKey("accounts.id"),nullable=False)
    
class Application(Base):
    __tablename__="applications"
    
    id =Column(Integer, primary_key=True)
    content =Column(String(1000),nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"),nullable=False)
    user_id=Column(Integer,ForeignKey("accounts.id"),nullable=False)
    
    