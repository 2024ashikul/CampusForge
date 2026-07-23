from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

# --- Skill Schema ---
class SkillSchema(BaseModel):
    name: str
    level: str  # 'Beginner' | 'Intermediate' | 'Advanced'

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: str
    department: str
    profile_pic: Optional[str] = None
    skills: Optional[List[SkillSchema]] = []

class UserCreate(UserBase):
    password: str
    bio: Optional[str] = None

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    skills: Optional[List[SkillSchema]] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    bio: Optional[str] = None
    is_active: int
    skills: Optional[List[SkillSchema]] = []

    class Config:
        from_attributes = True

# --- Club & Registration Schemas ---
class ClubJoinRequest(BaseModel):
    payment_method: Optional[str] = "Demo Credit Card"

class ClubBase(BaseModel):
    title: str
    description: str
    category: str = "technical"
    is_recruiting: int = 1
    join_format: str = "open"
    membership_fee: str = "free"
    lead_name: str = "Club Lead"
    tags: Optional[List[str]] = None
    base_department: str = "Engineering"
    image_url: Optional[str] = None

class ClubCreate(ClubBase):
    pass

class ClubUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_recruiting: Optional[int] = None
    join_format: Optional[str] = None
    membership_fee: Optional[str] = None
    lead_name: Optional[str] = None
    base_department: Optional[str] = None
    tags: Optional[List[str]] = None

class ClubMemberUpdate(BaseModel):
    role: Optional[str] = None # 'Admin', 'Lead', 'Member'
    status: Optional[str] = None # 'approved', 'pending'

class ClubResponse(ClubBase):
    id: int
    created_at: datetime
    member_count: int = 0
    is_joined: bool = False
    user_role: str = "EXTERNAL" # 'ADMIN', 'ENROLLED', 'EXTERNAL'
    member_role: Optional[str] = None
    member_status: Optional[str] = None

    class Config:
        from_attributes = True

# --- Event & Registration Schemas ---
class EventRegistrationRequest(BaseModel):
    team_name: Optional[str] = None
    payment_method: Optional[str] = "Demo Credit Card"

class EventBase(BaseModel):
    title: str
    short_description: str
    description_markdown: Optional[str] = None
    event_type: str = "workshop"
    status: str = "upcoming"
    participation_type: str = "individual"
    entrance_fee: str = "free"
    date: str
    time: str
    location: str
    virtual_link: Optional[str] = None
    image_url: Optional[str] = None
    club_id: Optional[int] = None
    tags: Optional[List[str]] = None
    results: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description_markdown: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    participation_type: Optional[str] = None
    entrance_fee: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    tags: Optional[List[str]] = None
    results: Optional[str] = None

class EventResultPublishRequest(BaseModel):
    results: str

class EventRegistrantUpdate(BaseModel):
    role: Optional[str] = None # 'Admin', 'Participant'
    status: Optional[str] = None # 'approved', 'pending'

class EventResponse(EventBase):
    id: int
    created_at: datetime
    club_title: Optional[str] = None
    registrant_count: int = 0
    is_registered: bool = False
    user_role: str = "EXTERNAL" # 'ADMIN', 'ENROLLED', 'EXTERNAL'
    registrant_role: Optional[str] = None
    registrant_status: Optional[str] = None

    class Config:
        from_attributes = True

# --- Post Schemas ---
class PostBase(BaseModel):
    title: str
    description: str
    post_type: str = "general"
    status: str = "published"
    user_id: Optional[int] = None
    club_id: Optional[int] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[Any]] = None

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: int
    created_at: datetime
    author_name: Optional[str] = None
    author_association: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[Any]] = None

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
