from fastapi import HTTPException
from datetime import datetime, timedelta
import jwt

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

# demo users
fake_users = {
    "admin": "1234"
}

def authenticate(username: str, password: str):
    return fake_users.get(username) == password

def create_token(username: str):
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded["sub"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")