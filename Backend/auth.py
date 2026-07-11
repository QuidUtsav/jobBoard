import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from fastapi import Depends,HTTPException
from database import SessionLocal,Account
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
def get_current_acount(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        acc_id= decoded_token.get("sub")
        if acc_id is None:
            raise HTTPException(status_code=401, detail="invalid token")
        account = db.query(Account).filter(Account.id == acc_id).first()
        if account is None:
            raise HTTPException(status_code=404, detail="acc not found")
    except JWTError:
        raise HTTPException(status_code=404,detail="inva lid token")
    return account
