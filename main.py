from fastapi import FastAPI,Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from database import SessionLocal
from schemas import AccountREsponse,CreateAccount,CreateApplication,CreatePost
from database import Account,Application,Post
from auth import hash_password,verify_password,generate_jwt_token,get_current_acount
from fastapi.security import OAuth2PasswordRequestForm
def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

@app.get("/accounts",response_model=list[AccountREsponse])
def get_accounts(db=Depends(get_db)):
    account = db.query(Account).all()
    return account

@app.post("/SignUp",response_model=AccountREsponse)
def create_acc(account:CreateAccount, db=Depends(get_db)):
    check = db.query(Account).filter(Account.email==account.email).first()
    if check:
        raise HTTPException(status_code=403, detail="you cannot create new acc with existing email")
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
    if application.post_id is None:
        raise HTTPException(status_code=404,detail="post does not exist")
    post = db.query(Post).filter(application.post_id==Post.id).first()
    if post.expiry_date:
        raise HTTPException(status_code=404, detail="this post has stopped taking response")
    if current_account.role=="freelancer":
        new_application = Application(content=application.content, post_id = application.post_id,user_id= current_account.id)
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
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