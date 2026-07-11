from fastapi import FastAPI,Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from schemas import PublicAccountResponse,AccountResponse,CreateAccount,CreateApplication,CreatePost
from database import Account,Application,Post
from auth import hash_password,verify_password,generate_jwt_token,get_current_acount
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime,timezone
def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://job-board-rho-seven.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/accounts",response_model=list[PublicAccountResponse])
def get_accounts(db=Depends(get_db),current_account= Depends(get_current_acount)):

    account = db.query(Account).all()
    return account

@app.post("/signup",response_model=AccountResponse)
def create_acc(account:CreateAccount, db=Depends(get_db)):
    check = db.query(Account).filter(Account.email==account.email).first()
    if check:
        raise HTTPException(status_code=403, detail="you cannot create new acc with existing email")
    if account.role == "hirer" or account.role == "freelancer":
        new_acc = Account(
            name=account.name,
            email=account.email,
            hashed_password=hash_password(account.password),
            role=account.role
        )
        db.add(new_acc)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=404, detail="email already in use.")
            
        db.refresh(new_acc)
        return new_acc
    else:
        raise HTTPException(status_code=400,detail="you must chose a valid role")

@app.post("/login")
def login(form_data:OAuth2PasswordRequestForm = Depends(),db=Depends(get_db)):
    acc = db.query(Account).filter(Account.email==form_data.username).first()
    if acc is None:
        raise HTTPException(status_code=404, detail="acc not found.")
    if verify_password(form_data.password,acc.hashed_password):
        token = generate_jwt_token({"sub":str(acc.id)})
        return {"access_token":token,"token_type":"bearer","acc_type":acc.role}
    else:
        raise HTTPException(status_code=403, detail="password incorrect")

@app.get("/posts")
def get_post(db = Depends(get_db), ):
    posts= db.query(Post).all()
    return posts
@app.post("/posts")
def create_post(post : CreatePost, db = Depends(get_db),current_acc =Depends(get_current_acount)):
    if current_acc.role!="hirer":
        raise HTTPException(status_code=403,detail="only hirer can post")
    new_post = Post(title=post.title,content = post.content,author_id = current_acc.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@app.get("/post/{post_id}/applications")
def get_application_on_post(post_id:int, db = Depends(get_db),current_acc = Depends(get_current_acount)):
    post = db.query(Post).filter(Post.id==post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="post not found")
    
    if (post.author_id==current_acc.id):
        application= db.query(Application).filter(Application.post_id==post_id).all()
    else:
        raise HTTPException(status_code=403, detail="you cannot access this page")
    return application

@app.post("/application")
def apply_application(application:CreateApplication,db=Depends(get_db),current_account=Depends(get_current_acount)):
    post = db.query(Post).filter(application.post_id==Post.id).first()
    if post is None:
        raise HTTPException(status_code=404,detail="post does not exist")
    if post.expiry_date<datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="this post has stopped taking response")
    if current_account.role=="freelancer":
        new_application = Application(content=application.content, post_id = application.post_id,user_id= current_account.id)
        try:
            db.add(new_application)
            db.commit()
            db.refresh(new_application)
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="you have already applied to this post.")
        return new_application
    else:
        raise HTTPException(status_code=403,detail="only freelancer role can apply")  
      
@app.get("/application/{user_id}")
def get_all_application_by_user(user_id:int, db=Depends(get_db),current_user=Depends(get_current_acount)):
    user = db.query(Account).filter(user_id==Account.id).first()
    if user is None:
        raise HTTPException(status_code=404,detail="user not found")
    if current_user.id == user.id:
        application = db.query(Application).filter(Application.user_id==user_id).all()
        return application
    else:
        raise HTTPException(status_code=403, detail="you cannot access this page")

@app.put("/post/{post_id}")
def update_post(post_id:int,updated_post:CreatePost,db = Depends(get_db),current_account=Depends(get_current_acount)):
    post = db.query(Post).filter(Post.id==post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="no post found")
    if (post.author_id != current_account.id):
        raise HTTPException(status_code=403,detail="you are not authorized to edit this post.")

    post.title=updated_post.title
    post.content=updated_post.content
    db.commit()
    db.refresh(post)
    return post 

@app.delete("/post/{post_id}")
def delete_post(post_id:int, db=Depends(get_db),current_account=Depends(get_current_acount)):
    post = db.query(Post).filter(Post.id==post_id).first()
    if post is None:
        raise HTTPException(status_code=404,detail="no post found")
    if post.author_id != current_account.id:
        raise HTTPException(status_code=403,detail="you cannot delete this post")
    try:
        db.query(Application).filter(Application.post_id==post_id).delete()
        db.delete(post)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409,detail="error deleting")
    return "deleted sucessfully"
    
@app.put("/application/{application_id}")
def edit_application(application_id:int, updated_application:CreateApplication,db=Depends(get_db),current_account=Depends(get_current_acount)):
    application = db.query(Application).filter(Application.id==application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="application not found")
    if application.user_id != current_account.id:
        raise HTTPException(status_code=403,detail="unauthorized")
    application.content = updated_application.content
    db.commit()
    db.refresh(application)
    return application

@app.get("/me",response_model=AccountResponse)
def my_detail(db=Depends(get_db),current_account=Depends(get_current_acount)):
    
    account = db.query(Account).filter(Account.id==current_account.id).first()
    return account

@app.delete("/application/{application_id}")
def delete_application(application_id:int,db=Depends(get_db),current_account=Depends(get_current_acount)):
    application = db.query(Application).filter(Application.id==application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="no application found")
    if application.user_id != current_account.id:
        raise HTTPException(status_code=403,detail="you cannot delete this")
    db.delete(application)
    db.commit()
    return "deleted application successfully"