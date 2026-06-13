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
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'forgotten_items_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

app = FastAPI(title="Forgetly API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    type: str = "custom"
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
    checked_items: List[str]
    forgotten_items: List[str]
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
    type: str
    minutes: Optional[int] = None
    time: Optional[str] = None

class SharedListResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: str
    share_code: str
    title: str
    emoji: Optional[str] = None
    items: List[SharedListItem]
    members: List[dict]
    status: str
    reminders: List[dict] = []
    created_at: datetime
    updated_at: datetime

class SupportChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

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

def generate_share_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def create_default_checklists(user_id: str):
    templates = [
        {"name": "Home Exit", "type": "home", "items": [
            {"id": str(uuid.uuid4()), "name": "Keys", "checked": False, "order": 0},
            {"id": str(uuid.uuid4()), "name": "Wallet", "checked": False, "order": 1},
            {"id": str(uuid.uuid4()), "name": "Phone", "checked": False, "order": 2},
            {"id": str(uuid.uuid4()), "name": "Charger", "checked": False, "order": 3},
        ]},
        {"name": "Travel/Hotel", "type": "travel", "items": [
            {"id": str(uuid.uuid4()), "name": "Passport", "checked": False, "order": 0},
            {"id": str(uuid.uuid4()), "name": "Charger", "checked": False, "order": 1},
            {"id": str(uuid.uuid4()), "name": "Clothes", "checked": False, "order": 2},
        ]},
        {"name": "Office Exit", "type": "office", "items": [
            {"id": str(uuid.uuid4()), "name": "Laptop", "checked": False, "order": 0},
            {"id": str(uuid.uuid4()), "name": "ID Badge", "checked": False, "order": 1},
            {"id": str(uuid.uuid4()), "name": "Keys", "checked": False, "order": 2},
        ]}
    ]
    for template in templates:
        checklist = {
            "id": str(uuid.uuid4()), "user_id": user_id,
            "name": template["name"], "type": template["type"],
            "items": template["items"], "location_id": None,
            "is_template": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }
        await db.checklists.insert_one(checklist)

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id, "email": data.email.lower(),
        "password": hash_password(data.password), "name": data.name,
        "is_premium": False, "is_guest": False, "created_at": datetime.utcnow(),
        "total_exits": 0, "total_items_saved": 0, "total_forgotten": 0,
        "current_streak": 0, "best_streak": 0, "last_exit_date": None
    }
    await db.users.insert_one(user)
    await create_default_checklists(user_id)
    token = create_token(user_id)
    return TokenResponse(access_token=token, user=UserResponse(**{k: v for k, v in user.items() if k != 'password'}))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=UserResponse(**{k: v for k, v in user.items() if k != 'password'}))

@api_router.post("/auth/guest", response_model=TokenResponse)
async def guest_login():
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id, "email": f"guest_{user_id[:8]}@guest.local",
        "password": "", "name": "Guest User",
        "is_premium": False, "is_guest": True, "created_at": datetime.utcnow(),
        "total_exits": 0, "total_items_saved": 0, "total_forgotten": 0,
        "current_streak": 0, "best_streak": 0, "last_exit_date": None
    }
    await db.users.insert_one(user)
    await create_default_checklists(user_id)
    token = create_token(user_id)
    return TokenResponse(access_token=token, user=UserResponse(**{k: v for k, v in user.items() if k != 'password'}))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    updates = {}
    if data.name:
        updates["name"] = data.name
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        user = await db.users.find_one({"id": user["id"]})
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    email = data.email.lower()
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    reset_entry = {
        "id": str(uuid.uuid4()), "email": email, "code": code,
        "reset_token": None, "attempts": 0, "max_attempts": 5,
        "used": False, "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "created_at": datetime.utcnow()
    }
    await db.password_resets.insert_one(reset_entry)
    logger.info(f"Reset code for {email}: {code}")
    return {"message": "Reset code sent.", "success": True, "dev_code": code}

@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(data: VerifyResetCodeRequest):
    reset_entry = await db.password_resets.find_one({
        "email": data.email.lower(), "used": False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not reset_entry or reset_entry["code"] != data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    reset_token = str(uuid.uuid4()) + "-" + str(uuid.uuid4())
    await db.password_resets.update_one(
        {"id": reset_entry["id"]},
        {"$set": {"reset_token": reset_token, "token_expires_at": datetime.utcnow() + timedelta(minutes=5)}}
    )
    return {"message": "Code verified.", "reset_token": reset_token, "success": True}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    reset_entry = await db.password_resets.find_one({
        "reset_token": data.reset_token, "used": False,
        "token_expires_at": {"$gt": datetime.utcnow()}
    })
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    await db.users.update_one({"email": reset_entry["email"]}, {"$set": {"password": hash_password(data.new_password)}})
    await db.password_resets.update_many({"email": reset_entry["email"]}, {"$set": {"used": True}})
    return {"message": "Password reset successfully!", "success": True}

@api_router.get("/checklists", response_model=List[ChecklistResponse])
async def get_checklists(user=Depends(get_current_user)):
    checklists = await db.checklists.find({"user_id": user["id"]}).to_list(100)
    return [ChecklistResponse(**c) for c in checklists]

@api_router.post("/checklists", response_model=ChecklistResponse)
async def create_checklist(data: ChecklistCreate, user=Depends(get_current_user)):
    checklist = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "name": data.name, "type": data.type,
        "items": [item.dict() for item in data.items],
        "location_id": data.location_id, "is_template": False,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
    }
    await db.checklists.insert_one(checklist)
    return ChecklistResponse(**checklist)

@api_router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(checklist_id: str, data: ChecklistUpdate, user=Depends(get_current_user)):
    updates = {"updated_at": datetime.utcnow()}
    if data.name is not None:
        updates["name"] = data.name
    if data.items is not None:
        updates["items"] = [item.dict() for item in data.items]
    if data.location_id is not None:
        updates["location_id"] = data.location_id
    await db.checklists.update_one({"id": checklist_id, "user_id": user["id"]}, {"$set": updates})
    checklist = await db.checklists.find_one({"id": checklist_id})
    return ChecklistResponse(**checklist)

@api_router.delete("/checklists/{checklist_id}")
async def delete_checklist(checklist_id: str, user=Depends(get_current_user)):
    await db.checklists.delete_one({"id": checklist_id, "user_id": user["id"]})
    return {"message": "Checklist deleted"}

@api_router.get("/locations", response_model=List[LocationResponse])
async def get_locations(user=Depends(get_current_user)):
    locations = await db.locations.find({"user_id": user["id"]}).to_list(100)
    return [LocationResponse(**loc) for loc in locations]

@api_router.post("/locations", response_model=LocationResponse)
async def create_location(data: LocationCreate, user=Depends(get_current_user)):
    location = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "name": data.name, "address": data.address,
        "latitude": data.latitude, "longitude": data.longitude,
        "created_at": datetime.utcnow()
    }
    await db.locations.insert_one(location)
    return LocationResponse(**location)

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, user=Depends(get_current_user)):
    await db.locations.delete_one({"id": location_id, "user_id": user["id"]})
    return {"message": "Location deleted"}

@api_router.post("/exits", response_model=ExitRecordResponse)
async def record_exit(data: ExitRecordCreate, user=Depends(get_current_user)):
    checklist = await db.checklists.find_one({"id": data.checklist_id})
    checklist_name = checklist["name"] if checklist else "Unknown"
    exit_record = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "checklist_id": data.checklist_id, "checklist_name": checklist_name,
        "checked_items": data.checked_items, "forgotten_items": data.forgotten_items,
        "location_id": data.location_id, "location_name": data.location_name,
        "created_at": datetime.utcnow()
    }
    await db.exits.insert_one(exit_record)
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"total_exits": 1, "total_items_saved": len(data.checked_items), "total_forgotten": len(data.forgotten_items)}}
    )
    return ExitRecordResponse(**exit_record)

@api_router.get("/exits", response_model=List[ExitRecordResponse])
async def get_exits(limit: int = 50, user=Depends(get_current_user)):
    exits = await db.exits.find({"user_id": user["id"]}).sort("created_at", -1).to_list(limit)
    return [ExitRecordResponse(**e) for e in exits]

@api_router.get("/stats")
async def get_stats(user=Depends(get_current_user)):
    return {
        "total_exits": user.get("total_exits", 0),
        "total_items_checked": user.get("total_items_saved", 0),
        "total_items_forgotten": user.get("total_forgotten", 0),
        "items_saved_today": 0, "items_forgotten_today": 0,
        "items_saved_week": 0, "items_forgotten_week": 0,
        "items_saved_month": 0, "items_forgotten_month": 0,
        "most_forgotten_items": [], "risk_score": 50,
        "current_streak": user.get("current_streak", 0),
        "best_streak": user.get("best_streak", 0),
        "exits_by_day": []
    }

@api_router.get("/suggestions")
async def get_suggestions(user=Depends(get_current_user)):
    return {"suggestions": []}

@api_router.post("/premium/activate")
async def activate_premium(user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_premium": True}})
    return {"message": "Premium activated!"}

@api_router.post("/shared-lists", response_model=SharedListResponse)
async def create_shared_list(data: SharedListCreate, user=Depends(get_current_user)):
    share_code = generate_share_code()
    items = [SharedListItem(text=item.text, emoji=item.emoji).dict() for item in data.items]
    now = datetime.utcnow()
    shared_list = {
        "id": str(uuid.uuid4()), "creator_id": user["id"],
        "creator_name": user.get("name", "User"), "share_code": share_code,
        "title": data.title, "emoji": data.emoji, "items": items,
        "members": [{"id": user["id"], "name": user.get("name", "User"), "role": "owner"}],
        "status": "pending", "reminders": [], "created_at": now, "updated_at": now
    }
    await db.shared_lists.insert_one(shared_list)
    return SharedListResponse(**shared_list)

@api_router.get("/shared-lists", response_model=List[SharedListResponse])
async def get_shared_lists(user=Depends(get_current_user)):
    lists = await db.shared_lists.find({"members.id": user["id"]}).sort("updated_at", -1).to_list(100)
    return [SharedListResponse(**sl) for sl in lists]

@api_router.post("/shared-lists/join")
async def join_shared_list(share_code: str, user=Depends(get_current_user)):
    sl = await db.shared_lists.find_one({"share_code": share_code.upper()})
    if not sl:
        raise HTTPException(status_code=404, detail="Invalid share code")
    return SharedListResponse(**sl)

@api_router.delete("/shared-lists/{list_id}")
async def delete_shared_list(list_id: str, user=Depends(get_current_user)):
    await db.shared_lists.delete_one({"id": list_id, "creator_id": user["id"]})
    return {"message": "Deleted"}

@api_router.get("/")
async def root():
    return {"message": "Forgetly API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.post("/support/chat")
async def support_chat(data: SupportChatRequest, user=Depends(get_current_user)):
    return {"response": "Support chat coming soon!", "session_id": data.session_id, "success": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
