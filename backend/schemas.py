import re
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, field_validator




class LoginRequest(BaseModel):
    student_id: str  
    email: str  
    password: str



class SkillSchema(BaseModel):
    name: str
    level: str  


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




STUDENT_ID_PATTERN = re.compile(r"^\d{7}$")


class UserBase(BaseModel):
    student_id: str
    name: str
    email: str
    profile_pic: Optional[str] = None
    skills: Optional[List[SkillSchema]] = []
    socials: Optional[Dict[str, str]] = None  

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





class ClubDetails(BaseModel):
    founded: Optional[str] = None
    lead_name: Optional[str] = "Club Lead"
    base_department: Optional[str] = "Engineering"
    category: Optional[str] = "technical"
    banner_url: Optional[str] = None
    profile_picture_url: Optional[str] = None


class ClubSettings(BaseModel):

    is_recruiting: Optional[bool] = True
    join_format: Optional[str] = "open"  
    membership_fee: Optional[str] = "free"
    is_results_public: Optional[bool] = True
    is_open: Optional[bool] = True
    payment_fee: Optional[float] = 0.0


class ClubJoinRequest(BaseModel):
    pass  


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
    role: Optional[str] = None  
    status: Optional[str] = None  


class ClubResponse(ClubBase):
    id: int
    created_at: datetime
    member_count: int = 0
    event_count: int = 0
    is_joined: bool = False
    user_role: str = "EXTERNAL"  
    member_role: Optional[str] = None
    member_status: Optional[str] = None

    class Config:
        from_attributes = True





class EventDetails(BaseModel):

    location: Optional[str] = None
    banner_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    virtual_link: Optional[str] = None
    description_markdown: Optional[str] = None
    results: Optional[str] = None


class EventSettings(BaseModel):

    participation_type: Optional[str] = "individual"  
    entrance_fee: Optional[str] = "free"
    is_attendees_public: Optional[bool] = True
    is_results_public: Optional[bool] = False


class EventRegistrationRequest(BaseModel):
    team_name: Optional[str] = None
    team_members: List[str] = []
    


class TeamMemberAddRequest(BaseModel):
    team_members: List[str] = []


class EventBase(BaseModel):
    title: str
    description: str
    event_type: str = "workshop"  
    status: str = "upcoming"  
    start_time: str  
    end_time: Optional[str] = None  
    club_id: Optional[int] = None
    event_id: Optional[int] = None
    tags: Optional[List[str]] = None
    details: Optional[EventDetails] = None
    settings: Optional[EventSettings] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    tags: Optional[List[str]] = None
    details: Optional[EventDetails] = None
    settings: Optional[EventSettings] = None


class EventResultPublishRequest(BaseModel):
    results: str


class EventRegistrantUpdate(BaseModel):
    role: Optional[str] = None  
    status: Optional[str] = None  
    team_name: Optional[str] = None  


class EventResponse(EventBase):
    id: int
    club_title: Optional[str] = None
    registrant_count: int = 0
    is_registered: bool = False
    user_role: str = "EXTERNAL"  
    registrant_role: Optional[str] = None
    registrant_status: Optional[str] = None

    class Config:
        from_attributes = True



class PostMediaSchema(BaseModel):
    id: Optional[int] = None
    media_type: str  
    file_url: str
    display_order: int = 0

    class Config:
        from_attributes = True



class PostBase(BaseModel):
    title: str
    description: str
    post_type: str = "post"  
    status: str = "published"  
    user_id: Optional[str] = None  
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
    updated_at: Optional[datetime] = None  
    author_name: Optional[str] = "Anonymous"
    author_association: Optional[str] = "STUDENT"  
    author_pic: Optional[str] = None
    reaction_counts: Optional[Dict[str, int]] = {}
    user_reaction: Optional[str] = None
    comment_count: int = 0
    email_notifications_queued: bool = False
    notification_recipient_count: int = 0

    class Config:
        from_attributes = True





class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None  


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: str  
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author_name: Optional[str] = None
    author_pic: Optional[str] = None

    class Config:
        from_attributes = True





class PostReactionCreate(BaseModel):
    reaction_type: str  


class PostReactionResponse(BaseModel):
    id: int
    post_id: int
    user_id: str  
    reaction_type: str

    class Config:
        from_attributes = True





class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class TokenData(BaseModel):
    student_id: Optional[str] = None
