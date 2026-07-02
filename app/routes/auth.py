from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import jwt

# ==============================
# CONFIG
# ==============================

SECRET_KEY = "maxiqueen_secret_key"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

# ==============================
# PASSWORD
# ==============================

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)

# ==============================
# TOKEN
# ==============================

def create_access_token(data: dict, expires_delta: int = 60):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=expires_delta)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt

# ==============================
# CURRENT USER
# ==============================

def get_current_user(token: str = Depends(oauth2_scheme)):

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return email

    except jwt.PyJWTError:

        raise HTTPException(status_code=401, detail="Invalid token")