from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ---------------------------------------------------------------------------
# Department code → name lookup
# Format of student_id: YYPPNNN  (YY=batch, PP=dept-code, NNN=seq)
# ---------------------------------------------------------------------------
DEPARTMENT_CODES = {
    "01": "Civil Engineering",
    "02": "Mechanical Engineering",
    "03": "Electrical Engineering",
    "04": "Computer Science & Engineering",
    "05": "Electronics & Communication Engineering",
    "06": "Chemical Engineering",
    "07": "Architecture",
    "08": "Business Administration",
    "09": "English",
    "10": "Mathematics & Physics",
}

def derive_department(student_id: str) -> str:
    """Extract department name from student_id string (format YYPPNNN)."""
    if len(student_id) >= 4:
        dept_code = student_id[2:4]
        return DEPARTMENT_CODES.get(dept_code, f"Department {dept_code}")
    return "Unknown"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserModel(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(20), nullable=False, unique=True, index=True)  # e.g. 2304001
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    profile_pic = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Integer, default=0)
    department = Column(String(255), nullable=False)  # auto-derived from student_id
    skills = Column(Text, nullable=True)    # JSON: [{"name": str, "level": str}]
    socials = Column(Text, nullable=True)   # JSON: {"github": "...", "linkedin": "...", ...}
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("PostModel", back_populates="author_user", cascade="all, delete-orphan")
    club_memberships = relationship("ClubMemberModel", back_populates="user", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistrantModel", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("CommentModel", back_populates="author", cascade="all, delete-orphan")
    reactions = relationship("PostReactionModel", back_populates="user", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Club
# ---------------------------------------------------------------------------
class ClubModel(Base):
    __tablename__ = "club"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    # details JSON: {"founded": "2020", "lead_name": "...", "base_department": "...",
    #                "category": "technical", "image_url": "..."}
    details = Column(Text, nullable=True)
    # settings JSON: {"is_recruiting": true, "join_format": "open",
    #                 "membership_fee": "free", "is_results_public": true,
    #                 "is_open": true, "payment_fee": 0}
    settings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("PostModel", back_populates="author_club", cascade="all, delete-orphan")
    members = relationship("ClubMemberModel", back_populates="club", cascade="all, delete-orphan")
    events = relationship("EventModel", back_populates="club", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Club Members
# ---------------------------------------------------------------------------
class ClubMemberModel(Base):
    __tablename__ = "club_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(100), default="Member")   # 'Admin', 'Moderator', 'Member'
    status = Column(String(50), default="approved") # 'approved', 'pending'
    payment_status = Column(String(50), default="completed")  # 'free', 'completed'
    payment_method = Column(String(50), nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("ClubModel", back_populates="members")
    user = relationship("UserModel", back_populates="club_memberships")


# ---------------------------------------------------------------------------
# Event
# ---------------------------------------------------------------------------
class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=False)
    event_type = Column(String(50), default="workshop")  # 'workshop', 'competition', 'guest-speaker', 'seminar'
    status = Column(String(50), default="upcoming")      # 'upcoming', 'ongoing', 'completed'
    date = Column(String(100), nullable=False)
    time = Column(String(100), nullable=False)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=True)
    tags = Column(Text, nullable=True)  # JSON list
    results = Column(Text, nullable=True)  # JSON or markdown of winners
    # details JSON: {"location": "...", "image_url": "...", "virtual_link": "...",
    #                "description_markdown": "..."}
    details = Column(Text, nullable=True)
    # settings JSON: {"participation_type": "individual", "entrance_fee": "free",
    #                 "is_attendees_public": true, "is_results_public": false}
    settings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("ClubModel", back_populates="events")
    registrants = relationship("EventRegistrantModel", back_populates="event", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Event Registrants
# ---------------------------------------------------------------------------
class EventRegistrantModel(Base):
    __tablename__ = "event_registrants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="Participant")    # 'Admin', 'Participant'
    status = Column(String(50), default="approved")     # 'approved', 'pending'
    team_name = Column(String(255), nullable=True)
    payment_status = Column(String(50), default="completed")
    payment_method = Column(String(50), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("EventModel", back_populates="registrants")
    user = relationship("UserModel", back_populates="event_registrations")


# ---------------------------------------------------------------------------
# Email Verification
# ---------------------------------------------------------------------------
class EmailVerification(Base):
    __tablename__ = "email_verification"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)


# ---------------------------------------------------------------------------
# Post
# ---------------------------------------------------------------------------
class PostModel(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    # post_type: 'post' (feed), 'project' (showcase), 'announcement' (event/club)
    post_type = Column(String(50), nullable=False, default="post")
    # status: 'draft', 'published', 'archived'
    status = Column(String(50), nullable=False, default="published")
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=True)
    club_id = Column(Integer, ForeignKey("club.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author_user = relationship("UserModel", back_populates="posts")
    author_club = relationship("ClubModel", back_populates="posts")
    tags = relationship("PostTagModel", back_populates="post", cascade="all, delete-orphan")
    media = relationship("PostMediaModel", back_populates="post", cascade="all, delete-orphan",
                        order_by="PostMediaModel.display_order")
    comments = relationship("CommentModel", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("PostReactionModel", back_populates="post", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Post Tags  (post_id + value = composite PK)
# ---------------------------------------------------------------------------
class PostTagModel(Base):
    __tablename__ = "post_tags"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    value = Column(String(100), primary_key=True, nullable=False)

    post = relationship("PostModel", back_populates="tags")


# ---------------------------------------------------------------------------
# Post Media
# ---------------------------------------------------------------------------
class PostMediaModel(Base):
    __tablename__ = "post_media"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    media_type = Column(String(50), nullable=False)  # 'photo', 'video', 'link'
    file_url = Column(Text, nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    post = relationship("PostModel", back_populates="media")


# ---------------------------------------------------------------------------
# Comments  (1-level threading: parent_id = NULL → root; parent_id = id → reply)
# ---------------------------------------------------------------------------
class CommentModel(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, nullable=True)   # FK to comments.id — resolved on the frontend
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("PostModel", back_populates="comments")
    author = relationship("UserModel", back_populates="comments")


# ---------------------------------------------------------------------------
# Post Reactions
# ---------------------------------------------------------------------------
class PostReactionModel(Base):
    __tablename__ = "post_reactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    # reaction_type: 'heart', 'like', 'fire', 'clap'
    reaction_type = Column(String(50), nullable=False, default="like")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_user_reaction"),
    )

    post = relationship("PostModel", back_populates="reactions")
    user = relationship("UserModel", back_populates="reactions")
