from pydantic import BaseModel, EmailStr

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
        
