from pydantic import BaseModel, EmailStr
from datetime import datetime
class CreateAccount(BaseModel):
    name:str
    email:EmailStr
    password:str
    role:str
class AccountREsponse(BaseModel):
    name:str
    email:EmailStr
    role:str
    
    class Config:
        from_attributes=True
        
class GetPost(BaseModel):
    id:int
    title:str
    content:str
    created_at:datetime
    expiry_date:datetime

class CreatePost(BaseModel):
    title:str
    content:str
    