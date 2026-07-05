from pydantic import BaseModel, EmailStr

class CreateAccount(BaseModel):
    name:str
    email:EmailStr
    hashed_password:str
    role:str
    
class 