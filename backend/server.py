from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'forgotten_items_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Forgotten Item Reminder API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ======================== MODELS ========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_premium: bool = False
    is_guest: bool = False
    created_at: datetime
    total_exits: int = 0
    total_items_saved: int = 0
    total_forgotten: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ChecklistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    checked: bool = False
    order: int = 0

class ChecklistCreate(BaseModel):
    name: str
    type: str = "custom"  # home, travel, office, custom
    items: List[ChecklistItem] = []
    location_id: Optional[str] = None

class ChecklistUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[List[ChecklistItem]] = None
    location_id: Optional[str] = None

class ChecklistResponse(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    items: List[ChecklistItem]
    location_id: Optional[str] = None
    is_template: bool = False
    created_at: datetime
    updated_at: datetime

class LocationCreate(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

class ExitRecordCreate(BaseModel):
    checklist_id: str
    checked_items: List[str]  # item ids
    forgotten_items: List[str]  # item ids
    location_id: Optional[str] = None
    location_name: Optional[str] = None

class ExitRecordResponse(BaseModel):
    id: str
    user_id: str
    checklist_id: str
    checklist_name: str
    checked_items: List[str]
    forgotten_items: List[str]
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    created_at: datetime

class StatsResponse(BaseModel):
    total_exits: int
    total_items_checked: int
    total_items_forgotten: int
    items_saved_today: int
    items_forgotten_today: int
    items_saved_week: int
    items_forgotten_week: int
    items_saved_month: int
    items_forgotten_month: int
    most_forgotten_items: List[dict]
    risk_score: int
    current_streak: int
    best_streak: int
    exits_by_day: List[dict]

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

# ======================== SHARED LIST MODELS ========================

class SharedListItemCreate(BaseModel):
    text: str
    emoji: Optional[str] = None

class SharedListItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    emoji: Optional[str] = None
    checked_by: List[str] = []

class SharedListCreate(BaseModel):
    title: str
    emoji: Optional[str] = None
    items: List[SharedListItemCreate] = []

class SharedListReminderCreate(BaseModel):
    type: str  # "after_minutes" or "at_time"
    minutes: Optional[int] = None
    time: Optional[str] = None  # ISO format

class SharedListResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: str
    share_code: str
    title: str
    emoji: Optional[str] = None
    items: List[SharedListItem]
    members: List[dict]
    status: str  # pending, in_progress, completed
    reminders: List[dict] = []
    created_at: datetime
    updated_at: datetime

# ======================== AUTH HELPERS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except:
        return None

# ======================== AUTH ROUTES ========================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email.lower(),
        "password": hash_password(data.password),
        "name": data.name,
        "is_premium": False,
        "is_guest": False,
        "created_at": datetime.utcnow(),
        "total_exits": 0,
        "total_items_saved": 0,
        "total_forgotten": 0,
        "current_streak": 0,
        "best_streak": 0,
        "last_exit_date": None
    }
    
    await db.users.insert_one(user)
    
    # Create default checklists
    await create_default_checklists(user_id)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user.items() if k != 'password'})
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user.items() if k != 'password'})
    )

@api_router.post("/auth/guest", response_model=TokenResponse)
async def guest_login():
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": f"guest_{user_id[:8]}@guest.local",
        "password": "",
        "name": "Guest User",
        "is_premium": False,
        "is_guest": True,
        "created_at": datetime.utcnow(),
        "total_exits": 0,
        "total_items_saved": 0,
        "total_forgotten": 0,
        "current_streak": 0,
        "best_streak": 0,
        "last_exit_date": None
    }
    
    await db.users.insert_one(user)
    await create_default_checklists(user_id)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(**{k: v for k, v in user.items() if k != 'password'})
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    # Guest users are always free - reset premium if accidentally set
    if user.get("is_guest", False) and user.get("is_premium", False):
        await db.users.update_one({"id": user["id"]}, {"$set": {"is_premium": False}})
        user["is_premium"] = False
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(data: ProfileUpdate, user = Depends(get_current_user)):
    updates = {}
    if data.name:
        updates["name"] = data.name
    
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        user = await db.users.find_one({"id": user["id"]})
    
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

# ======================== PASSWORD RESET ROUTES ========================

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Request password reset code.
    Always returns success to prevent email enumeration.
    For MVP: returns the code in response (replace with email service later).
    """
    email = data.email.lower()
    
    # Rate limit: max 3 active codes per email per hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = await db.password_resets.count_documents({
        "email": email,
        "created_at": {"$gte": one_hour_ago}
    })
    
    if recent_count >= 3:
        # Still return success to prevent enumeration, but don't create code
        return {
            "message": "If this email is registered, a reset code has been sent.",
            "success": True
        }
    
    # Check if user exists (but don't reveal in response)
    user = await db.users.find_one({"email": email, "is_guest": {"$ne": True}})
    
    if not user:
        # Return same success message — no email enumeration
        return {
            "message": "If this email is registered, a reset code has been sent.",
            "success": True
        }
    
    # Generate 6-digit code
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Invalidate all previous codes for this email
    await db.password_resets.update_many(
        {"email": email, "used": False},
        {"$set": {"used": True}}
    )
    
    # Store the reset code
    reset_entry = {
        "id": str(uuid.uuid4()),
        "email": email,
        "code": code,
        "reset_token": None,
        "attempts": 0,
        "max_attempts": 5,
        "used": False,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "created_at": datetime.utcnow()
    }
    
    await db.password_resets.insert_one(reset_entry)
    
    # TODO: Replace with actual email service integration
    # e.g. await send_email(email, "Your reset code", f"Your code is: {code}")
    logger.info(f"Password reset code generated for {email}: {code}")
    
    # For MVP: return code in response (remove in production with real email)
    return {
        "message": "If this email is registered, a reset code has been sent.",
        "success": True,
        "dev_code": code  # Remove this field when email service is integrated
    }


@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(data: VerifyResetCodeRequest):
    """
    Verify the 6-digit reset code and return a one-time reset token.
    """
    email = data.email.lower()
    code = data.code.strip()
    
    # Find valid reset entry
    reset_entry = await db.password_resets.find_one({
        "email": email,
        "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not reset_entry:
        raise HTTPException(
            status_code=400,
            detail="Code has expired or is invalid. Please request a new code."
        )
    
    # Check brute force attempts
    if reset_entry.get("attempts", 0) >= reset_entry.get("max_attempts", 5):
        await db.password_resets.update_one(
            {"id": reset_entry["id"]},
            {"$set": {"used": True}}
        )
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please request a new code."
        )
    
    # Verify code
    if reset_entry["code"] != code:
        await db.password_resets.update_one(
            {"id": reset_entry["id"]},
            {"$inc": {"attempts": 1}}
        )
        remaining = reset_entry.get("max_attempts", 5) - reset_entry.get("attempts", 0) - 1
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect code. {remaining} attempts remaining."
        )
    
    # Code is correct — generate a one-time reset token
    reset_token = str(uuid.uuid4()) + "-" + str(uuid.uuid4())
    
    await db.password_resets.update_one(
        {"id": reset_entry["id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "token_expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
        }
    )
    
    return {
        "message": "Code verified successfully.",
        "reset_token": reset_token,
        "success": True
    }


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password using the verified reset token.
    Password must be at least 8 characters with at least 1 letter and 1 number.
    """
    # Validate password strength
    password = data.new_password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    
    has_letter = any(c.isalpha() for c in password)
    has_number = any(c.isdigit() for c in password)
    if not has_letter or not has_number:
        raise HTTPException(status_code=400, detail="Password must contain at least 1 letter and 1 number.")
    
    # Find the reset entry with this token
    reset_entry = await db.password_resets.find_one({
        "reset_token": data.reset_token,
        "used": False,
        "token_expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not reset_entry:
        raise HTTPException(
            status_code=400,
            detail="Reset link has expired or is invalid. Please request a new code."
        )
    
    # Update user's password
    hashed = hash_password(password)
    result = await db.users.update_one(
        {"email": reset_entry["email"]},
        {"$set": {"password": hashed}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to reset password. Please try again.")
    
    # Mark token as used and invalidate all codes for this email
    await db.password_resets.update_many(
        {"email": reset_entry["email"]},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Password reset successful for {reset_entry['email']}")
    
    return {
        "message": "Password reset successfully! You can now log in with your new password.",
        "success": True
    }

# ======================== CHECKLIST HELPERS ========================

async def create_default_checklists(user_id: str):
    templates = [
        {
            "name": "Home Exit",
            "type": "home",
            "items": [
                {"id": str(uuid.uuid4()), "name": "Keys", "checked": False, "order": 0},
                {"id": str(uuid.uuid4()), "name": "Wallet", "checked": False, "order": 1},
                {"id": str(uuid.uuid4()), "name": "Phone", "checked": False, "order": 2},
                {"id": str(uuid.uuid4()), "name": "Charger", "checked": False, "order": 3},
                {"id": str(uuid.uuid4()), "name": "Headphones", "checked": False, "order": 4},
            ]
        },
        {
            "name": "Travel/Hotel",
            "type": "travel",
            "items": [
                {"id": str(uuid.uuid4()), "name": "Passport", "checked": False, "order": 0},
                {"id": str(uuid.uuid4()), "name": "Charger", "checked": False, "order": 1},
                {"id": str(uuid.uuid4()), "name": "Clothes", "checked": False, "order": 2},
                {"id": str(uuid.uuid4()), "name": "Toiletries", "checked": False, "order": 3},
                {"id": str(uuid.uuid4()), "name": "ID Card", "checked": False, "order": 4},
                {"id": str(uuid.uuid4()), "name": "Laptop", "checked": False, "order": 5},
            ]
        },
        {
            "name": "Office Exit",
            "type": "office",
            "items": [
                {"id": str(uuid.uuid4()), "name": "Laptop", "checked": False, "order": 0},
                {"id": str(uuid.uuid4()), "name": "ID Badge", "checked": False, "order": 1},
                {"id": str(uuid.uuid4()), "name": "Documents", "checked": False, "order": 2},
                {"id": str(uuid.uuid4()), "name": "Keys", "checked": False, "order": 3},
                {"id": str(uuid.uuid4()), "name": "Phone", "checked": False, "order": 4},
            ]
        }
    ]
    
    for template in templates:
        checklist = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": template["name"],
            "type": template["type"],
            "items": template["items"],
            "location_id": None,
            "is_template": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.checklists.insert_one(checklist)

# ======================== CHECKLIST ROUTES ========================

@api_router.get("/checklists", response_model=List[ChecklistResponse])
async def get_checklists(user = Depends(get_current_user)):
    checklists = await db.checklists.find({"user_id": user["id"]}).to_list(100)
    return [ChecklistResponse(**c) for c in checklists]

@api_router.get("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(checklist_id: str, user = Depends(get_current_user)):
    checklist = await db.checklists.find_one({"id": checklist_id, "user_id": user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return ChecklistResponse(**checklist)

@api_router.post("/checklists", response_model=ChecklistResponse)
async def create_checklist(data: ChecklistCreate, user = Depends(get_current_user)):
    # Check limit for free users
    if not user.get("is_premium", False):
        count = await db.checklists.count_documents({"user_id": user["id"]})
        if count >= 5:
            raise HTTPException(status_code=403, detail="Free users can only have 5 checklists. Upgrade to Premium!")
    
    checklist = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": data.name,
        "type": data.type,
        "items": [item.dict() for item in data.items],
        "location_id": data.location_id,
        "is_template": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.checklists.insert_one(checklist)
    return ChecklistResponse(**checklist)

@api_router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(checklist_id: str, data: ChecklistUpdate, user = Depends(get_current_user)):
    checklist = await db.checklists.find_one({"id": checklist_id, "user_id": user["id"]})
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    updates = {"updated_at": datetime.utcnow()}
    if data.name is not None:
        updates["name"] = data.name
    if data.items is not None:
        updates["items"] = [item.dict() for item in data.items]
    if data.location_id is not None:
        updates["location_id"] = data.location_id
    
    await db.checklists.update_one({"id": checklist_id}, {"$set": updates})
    checklist = await db.checklists.find_one({"id": checklist_id})
    return ChecklistResponse(**checklist)

@api_router.delete("/checklists/{checklist_id}")
async def delete_checklist(checklist_id: str, user = Depends(get_current_user)):
    result = await db.checklists.delete_one({"id": checklist_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return {"message": "Checklist deleted"}

# ======================== LOCATION ROUTES ========================

@api_router.get("/locations", response_model=List[LocationResponse])
async def get_locations(user = Depends(get_current_user)):
    locations = await db.locations.find({"user_id": user["id"]}).to_list(100)
    return [LocationResponse(**loc) for loc in locations]

@api_router.post("/locations", response_model=LocationResponse)
async def create_location(data: LocationCreate, user = Depends(get_current_user)):
    # Check limit for free users
    if not user.get("is_premium", False):
        count = await db.locations.count_documents({"user_id": user["id"]})
        if count >= 2:
            raise HTTPException(status_code=403, detail="Free users can only have 2 locations. Upgrade to Premium!")
    
    location = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": data.name,
        "address": data.address,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "created_at": datetime.utcnow()
    }
    
    await db.locations.insert_one(location)
    return LocationResponse(**location)

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, user = Depends(get_current_user)):
    result = await db.locations.delete_one({"id": location_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted"}

# ======================== EXIT RECORD ROUTES ========================

@api_router.post("/exits", response_model=ExitRecordResponse)
async def record_exit(data: ExitRecordCreate, user = Depends(get_current_user)):
    # Get checklist name
    checklist = await db.checklists.find_one({"id": data.checklist_id})
    checklist_name = checklist["name"] if checklist else "Unknown"
    
    exit_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "checklist_id": data.checklist_id,
        "checklist_name": checklist_name,
        "checked_items": data.checked_items,
        "forgotten_items": data.forgotten_items,
        "location_id": data.location_id,
        "location_name": data.location_name,
        "created_at": datetime.utcnow()
    }
    
    await db.exits.insert_one(exit_record)
    
    # Update user stats
    items_saved = len(data.checked_items)
    items_forgotten = len(data.forgotten_items)
    
    # Get last exit date for streak calculation
    today = datetime.utcnow().date()
    last_exit = user.get("last_exit_date")
    current_streak = user.get("current_streak", 0)
    best_streak = user.get("best_streak", 0)
    
    if items_forgotten == 0:  # Perfect exit
        if last_exit:
            last_exit_date = last_exit.date() if isinstance(last_exit, datetime) else last_exit
            if (today - last_exit_date).days == 1:
                current_streak += 1
            elif (today - last_exit_date).days > 1:
                current_streak = 1
        else:
            current_streak = 1
        
        if current_streak > best_streak:
            best_streak = current_streak
    else:
        current_streak = 0
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$inc": {
                "total_exits": 1,
                "total_items_saved": items_saved,
                "total_forgotten": items_forgotten
            },
            "$set": {
                "last_exit_date": datetime.utcnow(),
                "current_streak": current_streak,
                "best_streak": best_streak
            }
        }
    )
    
    # Track forgotten items for suggestions
    if checklist and items_forgotten > 0:
        for item in checklist.get("items", []):
            if item["id"] in data.forgotten_items:
                await db.forgotten_items.update_one(
                    {"user_id": user["id"], "item_name": item["name"].lower()},
                    {
                        "$inc": {"count": 1},
                        "$set": {"last_forgotten": datetime.utcnow()}
                    },
                    upsert=True
                )
    
    return ExitRecordResponse(**exit_record)

@api_router.get("/exits", response_model=List[ExitRecordResponse])
async def get_exits(limit: int = 50, user = Depends(get_current_user)):
    exits = await db.exits.find({"user_id": user["id"]}).sort("created_at", -1).to_list(limit)
    return [ExitRecordResponse(**e) for e in exits]

# ======================== STATS ROUTES ========================

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(user = Depends(get_current_user)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Get all exits with projection for performance
    all_exits = await db.exits.find(
        {"user_id": user["id"]},
        {"created_at": 1, "checked_items": 1, "forgotten_items": 1, "checklist_name": 1}
    ).to_list(1000)
    
    # Calculate stats
    items_saved_today = 0
    items_forgotten_today = 0
    items_saved_week = 0
    items_forgotten_week = 0
    items_saved_month = 0
    items_forgotten_month = 0
    
    # Exits by day for chart
    exits_by_day = {}
    
    for exit in all_exits:
        exit_date = exit["created_at"]
        day_key = exit_date.strftime("%Y-%m-%d")
        
        saved = len(exit.get("checked_items", []))
        forgotten = len(exit.get("forgotten_items", []))
        
        if day_key not in exits_by_day:
            exits_by_day[day_key] = {"date": day_key, "saved": 0, "forgotten": 0, "exits": 0}
        
        exits_by_day[day_key]["saved"] += saved
        exits_by_day[day_key]["forgotten"] += forgotten
        exits_by_day[day_key]["exits"] += 1
        
        if exit_date >= today_start:
            items_saved_today += saved
            items_forgotten_today += forgotten
        
        if exit_date >= week_start:
            items_saved_week += saved
            items_forgotten_week += forgotten
        
        if exit_date >= month_start:
            items_saved_month += saved
            items_forgotten_month += forgotten
    
    # Get most forgotten items
    forgotten_items = await db.forgotten_items.find({"user_id": user["id"]}).sort("count", -1).to_list(5)
    most_forgotten = [{"name": item["item_name"], "count": item["count"]} for item in forgotten_items]
    
    # Calculate risk score (0-100)
    total_exits = user.get("total_exits", 0)
    total_forgotten = user.get("total_forgotten", 0)
    
    if total_exits == 0:
        risk_score = 50  # Unknown
    else:
        forget_rate = total_forgotten / max(total_exits, 1)
        risk_score = min(100, int(forget_rate * 100))
    
    # Get last 7 days data
    last_7_days = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if day in exits_by_day:
            last_7_days.append(exits_by_day[day])
        else:
            last_7_days.append({"date": day, "saved": 0, "forgotten": 0, "exits": 0})
    
    return StatsResponse(
        total_exits=user.get("total_exits", 0),
        total_items_checked=user.get("total_items_saved", 0),
        total_items_forgotten=user.get("total_forgotten", 0),
        items_saved_today=items_saved_today,
        items_forgotten_today=items_forgotten_today,
        items_saved_week=items_saved_week,
        items_forgotten_week=items_forgotten_week,
        items_saved_month=items_saved_month,
        items_forgotten_month=items_forgotten_month,
        most_forgotten_items=most_forgotten,
        risk_score=risk_score,
        current_streak=user.get("current_streak", 0),
        best_streak=user.get("best_streak", 0),
        exits_by_day=last_7_days
    )

# ======================== SUGGESTIONS ========================

@api_router.get("/suggestions")
async def get_suggestions(user = Depends(get_current_user)):
    """Get smart suggestions based on forgotten patterns"""
    forgotten_items = await db.forgotten_items.find({"user_id": user["id"]}).sort("count", -1).to_list(3)
    
    suggestions = []
    for item in forgotten_items:
        if item["count"] >= 2:
            suggestions.append({
                "item_name": item["item_name"],
                "count": item["count"],
                "message": f"You often forget your {item['item_name']}. Add it to your checklist!"
            })
    
    return {"suggestions": suggestions}

# ======================== PREMIUM (TEST) ========================

@api_router.post("/premium/activate")
async def activate_premium(user = Depends(get_current_user)):
    """Activate premium for testing purposes"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_premium": True}}
    )
    user = await db.users.find_one({"id": user["id"]})
    return {"message": "Premium activated!", "user": UserResponse(**{k: v for k, v in user.items() if k != 'password'})}

@api_router.post("/premium/deactivate")
async def deactivate_premium(user = Depends(get_current_user)):
    """Deactivate premium for testing purposes"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_premium": False}}
    )
    user = await db.users.find_one({"id": user["id"]})
    return {"message": "Premium deactivated", "user": UserResponse(**{k: v for k, v in user.items() if k != 'password'})}

import random
import string

def generate_share_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ======================== SHARED LISTS ROUTES ========================

@api_router.post("/shared-lists", response_model=SharedListResponse)
async def create_shared_list(data: SharedListCreate, user = Depends(get_current_user)):
    share_code = generate_share_code()
    # Ensure unique code
    while await db.shared_lists.find_one({"share_code": share_code}):
        share_code = generate_share_code()
    
    items = [
        SharedListItem(text=item.text, emoji=item.emoji).dict()
        for item in data.items
    ]
    
    now = datetime.utcnow()
    shared_list = {
        "id": str(uuid.uuid4()),
        "creator_id": user["id"],
        "creator_name": user.get("name", "Guest User"),
        "share_code": share_code,
        "title": data.title,
        "emoji": data.emoji,
        "items": items,
        "members": [{"id": user["id"], "name": user.get("name", "Guest User"), "role": "owner"}],
        "status": "pending",
        "reminders": [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.shared_lists.insert_one(shared_list)
    return SharedListResponse(**shared_list)

@api_router.get("/shared-lists", response_model=List[SharedListResponse])
async def get_shared_lists(user = Depends(get_current_user)):
    lists = await db.shared_lists.find({
        "members.id": user["id"]
    }).sort("updated_at", -1).to_list(100)
    return [SharedListResponse(**sl) for sl in lists]

@api_router.get("/shared-lists/{list_id}", response_model=SharedListResponse)
async def get_shared_list(list_id: str, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"id": list_id, "members.id": user["id"]})
    if not sl:
        raise HTTPException(status_code=404, detail="Shared list not found")
    return SharedListResponse(**sl)

@api_router.put("/shared-lists/{list_id}/toggle/{item_id}")
async def toggle_shared_list_item(list_id: str, item_id: str, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"id": list_id, "members.id": user["id"]})
    if not sl:
        raise HTTPException(status_code=404, detail="Shared list not found")
    
    items = sl.get("items", [])
    updated = False
    all_checked = True
    
    for item in items:
        if item["id"] == item_id:
            if user["id"] in item.get("checked_by", []):
                item["checked_by"].remove(user["id"])
            else:
                if "checked_by" not in item:
                    item["checked_by"] = []
                item["checked_by"].append(user["id"])
            updated = True
        if not item.get("checked_by"):
            all_checked = False
    
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Auto-update status
    any_checked = any(item.get("checked_by") for item in items)
    new_status = "completed" if all_checked else ("in_progress" if any_checked else "pending")
    
    await db.shared_lists.update_one(
        {"id": list_id},
        {"$set": {"items": items, "status": new_status, "updated_at": datetime.utcnow()}}
    )
    
    sl = await db.shared_lists.find_one({"id": list_id})
    return SharedListResponse(**sl)

@api_router.post("/shared-lists/join")
async def join_shared_list(share_code: str, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"share_code": share_code.upper()})
    if not sl:
        raise HTTPException(status_code=404, detail="Invalid share code")
    
    # Check if already a member
    member_ids = [m["id"] for m in sl.get("members", [])]
    if user["id"] in member_ids:
        return SharedListResponse(**sl)
    
    # Add as member
    new_member = {"id": user["id"], "name": user.get("name", "Guest User"), "role": "member"}
    await db.shared_lists.update_one(
        {"id": sl["id"]},
        {
            "$push": {"members": new_member},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    sl = await db.shared_lists.find_one({"id": sl["id"]})
    return SharedListResponse(**sl)

@api_router.post("/shared-lists/{list_id}/reminder")
async def set_shared_list_reminder(list_id: str, data: SharedListReminderCreate, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"id": list_id, "members.id": user["id"]})
    if not sl:
        raise HTTPException(status_code=404, detail="Shared list not found")
    
    now = datetime.utcnow()
    reminder = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": data.type,
        "minutes": data.minutes,
        "time": data.time,
        "created_at": now.isoformat(),
        "triggered": False
    }
    
    await db.shared_lists.update_one(
        {"id": list_id},
        {
            "$push": {"reminders": reminder},
            "$set": {"updated_at": now}
        }
    )
    
    return {"message": "Reminder set!", "reminder": reminder}

@api_router.post("/shared-lists/{list_id}/items")
async def add_shared_list_item(list_id: str, data: SharedListItemCreate, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"id": list_id, "members.id": user["id"]})
    if not sl:
        raise HTTPException(status_code=404, detail="Shared list not found")
    
    new_item = SharedListItem(text=data.text, emoji=data.emoji).dict()
    
    await db.shared_lists.update_one(
        {"id": list_id},
        {
            "$push": {"items": new_item},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    sl = await db.shared_lists.find_one({"id": list_id})
    return SharedListResponse(**sl)

@api_router.delete("/shared-lists/{list_id}")
async def delete_shared_list(list_id: str, user = Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"id": list_id})
    if not sl:
        raise HTTPException(status_code=404, detail="Shared list not found")
    
    if sl["creator_id"] != user["id"]:
        # Just remove from members
        await db.shared_lists.update_one(
            {"id": list_id},
            {"$pull": {"members": {"id": user["id"]}}}
        )
        return {"message": "Left shared list"}
    
    await db.shared_lists.delete_one({"id": list_id})
    return {"message": "Shared list deleted"}

# ======================== HEALTH CHECK ========================

@api_router.get("/")
async def root():
    return {"message": "Forgotten Item Reminder API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ======================== SUPPORT CHAT ROUTE ========================

class SupportChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@api_router.post("/support/chat")
async def support_chat(data: SupportChatRequest, user: dict = Depends(get_current_user)):
    """AI-powered support chat for Frestivia app."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=500, detail="Support chat is temporarily unavailable.")
    
    session_id = data.session_id or f"support-{user['id']}-{uuid.uuid4().hex[:8]}"
    
    system_message = """You are Frestivia's friendly AI support assistant. You help users with the Frestivia app - a smart checklist and reminder app that helps people never forget items when leaving places.

KEY APP FEATURES you can help with:
- Checklists: Create, edit, delete checklists with items. Users tap "I'M LEAVING" to enter exit mode and check off items.
- Premium Features: Advanced Insights, Smart Suggestions, Background Geofencing, Shared Lists (unlimited).
- Free vs Premium: Free users have limited checklists (3), locations (2). Premium unlocks everything.
- Shared Lists: Create shared checklists with others using share codes.
- Background Geofencing: Premium feature that auto-reminds when leaving saved locations.
- Smart Suggestions: AI-powered checklist recommendations.
- Advanced Analytics: Detailed stats, risk score, forgetting patterns, streaks, trends.
- Locations: Save locations for reminders. Free: 2 max, Premium: unlimited.
- Voice Reminders: Text-to-speech reads forgotten items aloud.
- Dark Mode, Multi-language (15 languages), Password Reset via OTP.

COMMON ISSUES:
1. Can't log in -> Check email/password, use Forgot Password, guest accounts can't access premium.
2. Premium not showing -> Log out and back in, premium syncs on login.
3. Buttons not working -> Restart app, some need a checklist selected first.
4. Geofencing not working -> Check location permissions and Settings toggle.
5. Can't share lists -> Requires premium.
6. Voice not working -> Check Settings toggle and device volume.
7. Dark mode issues -> Settings > Appearance > Theme.

GUIDELINES: Be friendly, concise (<150 words), use emojis sparingly. If stuck, suggest Contact@frestvia.store."""

    try:
        chat = LlmChat(
            api_key=llm_key,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4.1-nano")
        
        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)
        
        chat_entry = {
            "user_id": user["id"],
            "session_id": session_id,
            "user_message": data.message,
            "ai_response": response,
            "created_at": datetime.utcnow()
        }
        await db.support_chats.insert_one(chat_entry)
        
        return {
            "response": response,
            "session_id": session_id,
            "success": True
        }
    except Exception as e:
        logger.error(f"Support chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get response. Please try again.")


@api_router.get("/support/history")
async def get_support_history(user: dict = Depends(get_current_user)):
    """Get chat history for the current user."""
    chats = await db.support_chats.find(
        {"user_id": user["id"]},
        {"_id": 0, "user_message": 1, "ai_response": 1, "created_at": 1, "session_id": 1}
    ).sort("created_at", -1).to_list(50)
    return {"chats": chats, "success": True}


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
