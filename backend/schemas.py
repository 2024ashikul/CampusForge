import re
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator

# Auth Schemas


class LoginRequest(BaseModel):
    student_id: str  # 7-digit student ID
    email: str  # Registered email address
    password: str


# Skill Schema
class SkillSchema(BaseModel):
    name: str
    level: str  # 'Beginner' | 'Intermediate' | 'Advanced'


class SkillSummary(BaseModel):
    skill: str
    student_count: int


class SkillStudentResponse(BaseModel):
    student_id: str
    name: str
    email: str
    department: str
    profile_pic: Optional[str] = None
    bio: Optional[str] = None
    skill: str
    skill_level: str


# User Schemas

STUDENT_ID_PATTERN = re.compile(r"^\d{7}$")


class UserBase(BaseModel):
    student_id: str
    name: str
    email: str
    profile_pic: Optional[str] = None
    skills: Optional[List[SkillSchema]] = []
    socials: Optional[Dict[str, str]] = None  # {"github": "...", "linkedin": "...", ...}

    @field_validator("student_id")
    @classmethod
    def validate_student_id(cls, v: str) -> str:
        if not STUDENT_ID_PATTERN.match(v):
            raise ValueError("student_id must be exactly 7 digits (format YYPPNNN)")
        return v


class UserCreate(UserBase):
    password: str
    bio: Optional[str] = None


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    skills: Optional[List[SkillSchema]] = None
    socials: Optional[Dict[str, str]] = None
    name: Optional[str] = None


class UserResponse(BaseModel):
    student_id: str
    name: str
    email: str
    department: str
    profile_pic: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[SkillSchema]] = []
    socials: Optional[Dict[str, str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Club Schemas


class ClubDetails(BaseModel):
    founded: Optional[str] = None
    lead_name: Optional[str] = "Club Lead"
    base_department: Optional[str] = "Engineering"
    category: Optional[str] = "technical"
    banner_url: Optional[str] = None
    profile_picture_url: Optional[str] = None


class ClubSettings(BaseModel):

    is_recruiting: Optional[bool] = True
    join_format: Optional[str] = "open"  # 'open', 'interview', 'portfolio-review'
    membership_fee: Optional[str] = "free"
    is_results_public: Optional[bool] = True
    is_open: Optional[bool] = True
    payment_fee: Optional[float] = 0.0


class ClubJoinRequest(BaseModel):
    pass  # No payment data stored — dummy payment handled purely on frontend


class ClubBase(BaseModel):
    title: str
    description: str
    details: Optional[ClubDetails] = None
    settings: Optional[ClubSettings] = None


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    details: Optional[ClubDetails] = None
    settings: Optional[ClubSettings] = None


class ClubMemberUpdate(BaseModel):
    role: Optional[str] = None  # 'Admin', 'Moderator', 'Member'
    status: Optional[str] = None  # 'approved', 'pending'


class ClubResponse(ClubBase):
    id: int
    created_at: datetime
    member_count: int = 0
    event_count: int = 0
    is_joined: bool = False
    user_role: str = "EXTERNAL"  # 'ADMIN', 'ENROLLED', 'EXTERNAL'
    member_role: Optional[str] = None
    member_status: Optional[str] = None

    class Config:
        from_attributes = True


# Event Schemas


class EventDetails(BaseModel):

    location: Optional[str] = None
    banner_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    virtual_link: Optional[str] = None
    description_markdown: Optional[str] = None


class EventSettings(BaseModel):

    participation_type: Optional[str] = "individual"  # 'individual', 'team'
    entrance_fee: Optional[str] = "free"
    is_attendees_public: Optional[bool] = True
    is_results_public: Optional[bool] = False


class EventRegistrationRequest(BaseModel):
    team_name: Optional[str] = None
    team_members: List[str] = []
    # No payment data stored — dummy payment purely frontend


class TeamMemberAddRequest(BaseModel):
    team_members: List[str] = []


class EventBase(BaseModel):
    title: str
    short_description: str
    event_type: str = "workshop"  # 'workshop', 'competition', 'guest-speaker', 'seminar'
    status: str = "upcoming"  # 'draft', 'upcoming', 'ongoing', 'completed'
    start_time: str  # ISO datetime string e.g. "2026-08-15T18:00"
    end_time: Optional[str] = None  # ISO datetime string e.g. "2026-08-15T21:00"
    club_id: Optional[int] = None
    event_id: Optional[int] = None
    tags: Optional[List[str]] = None
    results: Optional[str] = None
    details: Optional[EventDetails] = None
    settings: Optional[EventSettings] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    tags: Optional[List[str]] = None
    results: Optional[str] = None
    details: Optional[EventDetails] = None
    settings: Optional[EventSettings] = None


class EventResultPublishRequest(BaseModel):
    results: str


class EventRegistrantUpdate(BaseModel):
    role: Optional[str] = None  # 'Admin', 'Participant'
    status: Optional[str] = None  # 'approved', 'pending'
    team_name: Optional[str] = None  # Used as the editable display role for event admins


class EventResponse(EventBase):
    id: int
    club_title: Optional[str] = None
    registrant_count: int = 0
    is_registered: bool = False
    user_role: str = "EXTERNAL"  # 'ADMIN', 'ENROLLED', 'EXTERNAL'
    registrant_role: Optional[str] = None
    registrant_status: Optional[str] = None

    class Config:
        from_attributes = True


# Post Media Schema
class PostMediaSchema(BaseModel):
    id: Optional[int] = None
    media_type: str  # 'photo', 'video', 'link'
    file_url: str
    display_order: int = 0

    class Config:
        from_attributes = True


# Post Schemas
class PostBase(BaseModel):
    title: str
    description: str
    post_type: str = "post"  # 'post', 'project', 'announcement'
    status: str = "published"  # 'draft', 'published', 'archived'
    user_id: Optional[str] = None  # student_id (String) of author
    club_id: Optional[int] = None
    event_id: Optional[int] = None
    tags: Optional[List[str]] = []
    media: Optional[List[PostMediaSchema]] = []


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    post_type: Optional[str] = None
    status: Optional[str] = None
    event_id: Optional[int] = None
    tags: Optional[List[str]] = None
    media: Optional[List[PostMediaSchema]] = None


class PostResponse(PostBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None  # Added to prevent missing field errors
    author_name: Optional[str] = "Anonymous"
    author_association: Optional[str] = "STUDENT"  # 'STUDENT' | 'CLUB'
    author_pic: Optional[str] = None
    reaction_counts: Optional[Dict[str, int]] = {}
    user_reaction: Optional[str] = None
    comment_count: int = 0
    email_notifications_queued: bool = False
    notification_recipient_count: int = 0

    class Config:
        from_attributes = True


# Comment Schemas  (flat list — frontend groups by parent_id)


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None  # None = root, int = reply to root comment


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: str  # student_id
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author_name: Optional[str] = None
    author_pic: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Post Reaction Schemas
# ---------------------------------------------------------------------------
class PostReactionCreate(BaseModel):
    reaction_type: str  # 'heart', 'like', 'fire', 'clap'


class PostReactionResponse(BaseModel):
    id: int
    post_id: int
    user_id: str  # student_id
    reaction_type: str

    class Config:
        from_attributes = True


# Token Schemas


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TokenData(BaseModel):
    student_id: Optional[str] = None
