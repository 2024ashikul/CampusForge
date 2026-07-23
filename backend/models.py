from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UserModel(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    profile_pic = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Integer, default=0)
    department = Column(String(255), nullable=False)
    skills = Column(Text, nullable=True) # JSON list of {"name": str, "level": str}
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("PostModel", back_populates="author_user", cascade="all, delete-orphan")
    club_memberships = relationship("ClubMemberModel", back_populates="user", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistrantModel", back_populates="user", cascade="all, delete-orphan")

class ClubModel(Base):
    __tablename__ = "club"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default="technical")
    is_recruiting = Column(Integer, default=1) # 1 = true, 0 = false
    join_format = Column(String(50), default="open") # 'open', 'interview', 'portfolio-review'
    membership_fee = Column(String(50), default="free") # 'free' or fee e.g. '$10'
    lead_name = Column(String(255), default="Club Lead")
    tags = Column(Text, nullable=True)
    base_department = Column(String(255), default="Engineering")
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("PostModel", back_populates="author_club", cascade="all, delete-orphan")
    members = relationship("ClubMemberModel", back_populates="club", cascade="all, delete-orphan")
    events = relationship("EventModel", back_populates="club", cascade="all, delete-orphan")

class ClubMemberModel(Base):
    __tablename__ = "club_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), default="Member") # 'Admin', 'Lead', 'Member'
    status = Column(String(50), default="approved") # 'approved', 'pending'
    payment_status = Column(String(50), default="completed") # 'free', 'completed'
    payment_method = Column(String(50), nullable=True) # 'Credit Card', 'BKash / Mobile Wallet', 'Campus Credit'
    joined_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("ClubModel", back_populates="members")
    user = relationship("UserModel", back_populates="club_memberships")

class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=False)
    description_markdown = Column(Text, nullable=True)
    event_type = Column(String(50), default="workshop") # 'workshop', 'competition', 'guest-speaker'
    status = Column(String(50), default="upcoming") # 'upcoming', 'completed'
    participation_type = Column(String(50), default="individual") # 'individual', 'team'
    entrance_fee = Column(String(50), default="free") # 'free' or '$15'
    date = Column(String(100), nullable=False)
    time = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    virtual_link = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=True)
    tags = Column(Text, nullable=True)
    results = Column(Text, nullable=True) # JSON or markdown string of event winners & results
    created_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("ClubModel", back_populates="events")
    registrants = relationship("EventRegistrantModel", back_populates="event", cascade="all, delete-orphan")

class EventRegistrantModel(Base):
    __tablename__ = "event_registrants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="Participant") # 'Admin', 'Participant'
    status = Column(String(50), default="approved") # 'approved', 'pending'
    team_name = Column(String(255), nullable=True)
    payment_status = Column(String(50), default="completed")
    payment_method = Column(String(50), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("EventModel", back_populates="registrants")
    user = relationship("UserModel", back_populates="event_registrations")

class EmailVerification(Base):
    __tablename__ = "email_verification"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
class PostModel(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    post_type = Column(String(50), nullable=False, default="general")
    status = Column(String(50), nullable=False, default="published")
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=True)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=True)
    tags = Column(Text, nullable=True)
    attachments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    author_user = relationship("UserModel", back_populates="posts")
    author_club = relationship("ClubModel", back_populates="posts")
