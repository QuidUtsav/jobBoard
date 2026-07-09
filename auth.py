import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
load_dotenv()
def hash_password(password:str)->str:
    return bcrypt.hashpw(password.encode("utf-8"),bcrypt.gensalt()).decode("utf-8")
def verify_password(plain_password:str, hashed_password:str)->bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"),hashed_password.encode("utf-8"))

SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
def generate_jwt_token(data:dict,expiry_minutes=30):
    to_encode = data.copy()
    expire = datetime.now()+timedelta(minutes=expiry_minutes)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,ALGORITHM)

