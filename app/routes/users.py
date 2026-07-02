from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.database import get_db
from app.models.user import User
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

# ==============================
# SCHEMAS
# ==============================

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str


# ==============================
# REGISTER
# ==============================

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    hashed = hash_password(user.password)

    new_user = User(
        email=user.email,
        hashed_password=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"msg": "Usuario registrado correctamente"}


# ==============================
# LOGIN
# ==============================

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Password incorrecto")

    token = create_access_token({"sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ==============================
# CURRENT USER
# ==============================

@router.get("/me")
def read_users_me(current_user: str = Depends(get_current_user)):

    return {
        "email": current_user
    }