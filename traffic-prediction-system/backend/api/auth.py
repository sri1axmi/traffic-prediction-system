from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import jwt
import re
from datetime import datetime, timedelta
from passlib.context import CryptContext

router = APIRouter()

SECRET_KEY = "antigravity-traffic-secret-2024"
ALGORITHM  = "HS256"
TOKEN_EXPIRY_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

WEAK_PASSWORDS = {
    '123456', '12345678', '123456789', 'password', 'password1',
    '0000', '00000000', '111111', 'qwerty', 'abc123',
    'letmein', 'welcome', 'monkey', 'master', 'dragon',
    'login', 'princess', 'admin', 'iloveyou', 'passw0rd',
}

# In-memory user store (replace with DB in production)
users_db: dict[str, str] = {}  # identifier → hashed_password


class AuthRequest(BaseModel):
    identifier: str  # email or phone
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    identifier: str


def validate_password_strength(password: str) -> str | None:
    """Returns error string if invalid, None if valid."""
    if password.lower() in WEAK_PASSWORDS:
        return "Password is too common. Choose a stronger one."
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if len(password) > 64:
        return "Password must not exceed 64 characters."
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r'[0-9]', password):
        return "Password must contain at least one number."
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>/?\\|`~]', password):
        return "Password must contain at least one special character."
    return None


def create_token(identifier: str) -> str:
    payload = {
        "sub": identifier,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup", response_model=AuthResponse)
async def signup(req: AuthRequest):
    if req.identifier in users_db:
        raise HTTPException(status_code=400, detail="User already exists.")

    err = validate_password_strength(req.password)
    if err:
        raise HTTPException(status_code=422, detail=err)

    hashed = pwd_context.hash(req.password)
    users_db[req.identifier] = hashed
    return AuthResponse(
        access_token=create_token(req.identifier),
        token_type="bearer",
        identifier=req.identifier,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: AuthRequest):
    hashed = users_db.get(req.identifier)
    if not hashed or not pwd_context.verify(req.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    return AuthResponse(
        access_token=create_token(req.identifier),
        token_type="bearer",
        identifier=req.identifier,
    )
