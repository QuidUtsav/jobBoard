from pydantic import BaseModel, EmailStr
from datetime import datetime
class CreateAccount(BaseModel):
    name:str
    email:EmailStr
    password:str
    role:str
class AccountResponse(BaseModel):
    id:int
    name:str
    email:EmailStr
    role:str
    
    class Config:
        from_attributes=True
        
class PublicAccountResponse(BaseModel):
    name:str
    role:str
    
class GetPost(BaseModel):
    id:int
    title:str
    content:str
    created_at:datetime
    expiry_date:datetime

class CreatePost(BaseModel):
    title:str
    content:str
    
class CreateApplication(BaseModel):
    content:str
    post_id:int
    