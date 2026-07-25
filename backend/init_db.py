import json
from sqlalchemy import inspect, text
from database import engine, SessionLocal, Base
from models import (
    UserModel, ClubModel, PostModel, PostTagModel, PostMediaModel,
    EventModel, ClubMemberModel, EventRegistrantModel,
    CommentModel, PostReactionModel, SkillModel
)
from auth import get_password_hash


def init_db():
    print("[Init DB] Creating tables...")
    Base.metadata.create_all(bind=engine)
    # Migrate the pre-v3.1 JSON user.skills column when it is present.  The
    # column is deliberately no longer mapped; skills now live in their own
    # one-to-many table.
    user_columns = {column["name"] for column in inspect(engine).get_columns("user")}
    if "skills" in user_columns:
        with engine.begin() as connection:
            legacy_users = connection.execute(text('SELECT student_id, skills FROM "user" WHERE skills IS NOT NULL')).mappings()
            for legacy_user in legacy_users:
                try:
                    legacy_skills = json.loads(legacy_user["skills"])
                except (TypeError, json.JSONDecodeError):
                    legacy_skills = []
                for skill in legacy_skills if isinstance(legacy_skills, list) else []:
                    name = str(skill.get("name", "")).strip() if isinstance(skill, dict) else ""
                    level = str(skill.get("level", "Beginner")) if isinstance(skill, dict) else "Beginner"
                    if name:
                        connection.execute(text(
                            "INSERT INTO skills (user_id, skill, skill_level) "
                            "SELECT :user_id, :skill, :skill_level "
                            "WHERE NOT EXISTS (SELECT 1 FROM skills WHERE user_id = :user_id AND skill = :skill)"
                        ), {"user_id": legacy_user["student_id"], "skill": name, "skill_level": level})
    # Lightweight development migration for existing SQLite databases.
    columns = {column["name"] for column in inspect(engine).get_columns("posts")}
    if "event_id" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE posts ADD COLUMN event_id INTEGER REFERENCES events(id) ON DELETE CASCADE"))

    db = SessionLocal()
    try:
        if db.query(UserModel).first():
            print("[Init DB] Database already contains data.")
            return

        print("[Init DB] Seeding initial sample data...")

        # ---------------------------------------------------------------
        # Users  (student_id format: YYPPNNN — 26=batch, 04=CSE, 07=Arch, 02=Mech)
        # Department is derived from student_id (04->CSE, 07->Arch, 02->Mech)
        # ---------------------------------------------------------------
        u1 = UserModel(
            student_id="2604001",
            name="Alex Rivera",
            email="alex.rivera@campusforge.edu",
            password=get_password_hash("password123"),
            profile_pic="👨‍💻",
            bio="Systems engineering enthusiast and platform developer.",
            socials=json.dumps({
                "github": "https://github.com/alexrivera",
                "linkedin": "https://linkedin.com/in/alexrivera",
            }),
        )
        u2 = UserModel(
            student_id="2607001",
            name="Sarah Chen",
            email="sarah.chen@campusforge.edu",
            password=get_password_hash("password123"),
            profile_pic="👩‍💻",
            bio="UI/UX design architect and web developer.",
            socials=json.dumps({
                "github": "https://github.com/sarahchen",
                "twitter": "https://twitter.com/sarahchen",
                "website": "https://sarahchen.design",
            }),
        )
        u3 = UserModel(
            student_id="2602001",
            name="Marcus Vance",
            email="marcus.vance@campusforge.edu",
            password=get_password_hash("password123"),
            profile_pic="⚙️",
            bio="Robotics and embedded systems engineer.",
            socials=json.dumps({
                "github": "https://github.com/marcusvance",
                "linkedin": "https://linkedin.com/in/marcusvance",
            }),
        )
        db.add_all([u1, u2, u3])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        db.refresh(u3)
        db.add_all([
            SkillModel(user_id=u1.student_id, skill="Python", skill_level="Advanced"),
            SkillModel(user_id=u1.student_id, skill="React", skill_level="Intermediate"),
            SkillModel(user_id=u1.student_id, skill="C++", skill_level="Beginner"),
            SkillModel(user_id=u1.student_id, skill="RTOS", skill_level="Advanced"),
            SkillModel(user_id=u2.student_id, skill="UI/UX Design", skill_level="Advanced"),
            SkillModel(user_id=u2.student_id, skill="Figma", skill_level="Advanced"),
            SkillModel(user_id=u2.student_id, skill="TypeScript", skill_level="Intermediate"),
            SkillModel(user_id=u2.student_id, skill="Tailwind CSS", skill_level="Advanced"),
            SkillModel(user_id=u3.student_id, skill="C++", skill_level="Advanced"),
            SkillModel(user_id=u3.student_id, skill="ROS", skill_level="Advanced"),
            SkillModel(user_id=u3.student_id, skill="SolidWorks", skill_level="Intermediate"),
        ])
        db.commit()

        # ---------------------------------------------------------------
        # Clubs  (details + settings JSON)
        # ---------------------------------------------------------------
        c1 = ClubModel(
            title="Google Developer Student Club",
            description="The premier technical collective for scaling software products, exploring AI tooling, and building community ecosystems.",
            details=json.dumps({
                "founded": "2021",
                "lead_name": "Alex Rivera",
                "base_department": "Computer Science & Engineering",
                "category": "technical",
                "banner_url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
            }),
            settings=json.dumps({
                "is_recruiting": True,
                "join_format": "interview",
                "membership_fee": "free",
                "is_results_public": True,
                "is_open": True,
                "payment_fee": 0,
            }),
        )
        c2 = ClubModel(
            title="Pixel Perfect Design Club",
            description="Crafting pixel-perfect interface components, establishing unified design tokens, and hosting multi-campus Figma hackathons.",
            details=json.dumps({
                "founded": "2022",
                "lead_name": "Sarah Chen",
                "base_department": "Architecture",
                "category": "creative",
                "banner_url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
            }),
            settings=json.dumps({
                "is_recruiting": True,
                "join_format": "portfolio-review",
                "membership_fee": "$10",
                "is_results_public": True,
                "is_open": True,
                "payment_fee": 10,
            }),
        )
        c3 = ClubModel(
            title="Robotics & Automation Society",
            description="Designing high-performance mechanical systems, firmware control loops, and autonomous EV prototypes.",
            details=json.dumps({
                "founded": "2019",
                "lead_name": "Marcus Vance",
                "base_department": "Mechanical Engineering",
                "category": "technical",
                "banner_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
            }),
            settings=json.dumps({
                "is_recruiting": False,
                "join_format": "interview",
                "membership_fee": "free",
                "is_results_public": False,
                "is_open": True,
                "payment_fee": 0,
            }),
        )
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)

        # ---------------------------------------------------------------
        # Club Memberships (user_id is student_id string)
        # ---------------------------------------------------------------
        db.add_all([
            ClubMemberModel(club_id=c1.id, user_id=u1.student_id, role="Admin", status="approved"),
            ClubMemberModel(club_id=c2.id, user_id=u2.student_id, role="Admin", status="approved"),
            ClubMemberModel(club_id=c3.id, user_id=u3.student_id, role="Admin", status="approved"),
            ClubMemberModel(club_id=c1.id, user_id=u2.student_id, role="Member", status="approved"),
        ])
        db.commit()

        # ---------------------------------------------------------------
        # Events  (details + settings JSON, start_time/end_time ISO strings)
        # ---------------------------------------------------------------
        e1 = EventModel(
            title="ByteCraft Hackathon 2026",
            short_description="The ultimate campus-wide 36-hour hackathon targeting web3 and sustainability paradigms.",
            event_type="competition",
            status="upcoming",
            start_time="2026-05-28T09:00",
            end_time="2026-05-29T21:00",
            club_id=c1.id,
            tags=json.dumps(["Next.js", "Hackathon", "Web3", "AI"]),
            details=json.dumps({
                "location": "Main Auditorium & Discord",
                "banner_url": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80",
                "virtual_link": "https://discord.gg/campusforge-bytecraft",
                "description_markdown": "### Welcome to ByteCraft 2026\n\nBuild innovative solutions using cutting-edge APIs.",
            }),
            settings=json.dumps({
                "participation_type": "team",
                "entrance_fee": "free",
                "is_attendees_public": True,
                "is_results_public": False,
            }),
        )
        e2 = EventModel(
            title="UI/UX Design Systems Mastery",
            short_description="Construct complex, highly scalable atomic design components and interactive tokens in Figma.",
            event_type="workshop",
            status="upcoming",
            start_time="2026-06-05T14:30",
            end_time="2026-06-05T17:30",
            club_id=c2.id,
            tags=json.dumps(["Design", "Figma", "UI/UX"]),
            details=json.dumps({
                "location": "Design Lab 3",
                "banner_url": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
                "virtual_link": None,
                "description_markdown": "### Advanced Component Architecture Workshop\n\nHands-on token mapping and Figma auto-layout exercises.",
            }),
            settings=json.dumps({
                "participation_type": "individual",
                "entrance_fee": "$15",
                "is_attendees_public": True,
                "is_results_public": False,
            }),
        )
        e3 = EventModel(
            title="Embedded RTOS & Microkernel Architecture",
            short_description="Hands-on flashing of deterministic tasks onto real-time sensor array kits.",
            event_type="workshop",
            status="upcoming",
            start_time="2026-06-12T10:00",
            end_time="2026-06-12T13:00",
            club_id=c3.id,
            tags=json.dumps(["Hardware", "C++", "RTOS"]),
            details=json.dumps({
                "location": "Lab 4, Engineering Core",
                "banner_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
                "virtual_link": None,
                "description_markdown": "Flashing real-time microkernel OS on hardware boards.",
            }),
            settings=json.dumps({
                "participation_type": "individual",
                "entrance_fee": "free",
                "is_attendees_public": True,
                "is_results_public": False,
            }),
        )
        db.add_all([e1, e2, e3])
        db.commit()
        db.refresh(e1)
        db.refresh(e2)
        db.refresh(e3)

        # Event registrants (user_id is student_id string)
        db.add_all([
            EventRegistrantModel(event_id=e1.id, user_id=u1.student_id, role="Admin", status="approved"),
            EventRegistrantModel(event_id=e2.id, user_id=u2.student_id, role="Admin", status="approved"),
            EventRegistrantModel(event_id=e3.id, user_id=u3.student_id, role="Admin", status="approved"),
            # Sample participant
            EventRegistrantModel(event_id=e1.id, user_id=u2.student_id, team_name="PixelCraft Team", role="Participant", status="approved"),
        ])
        db.commit()

        # ---------------------------------------------------------------
        # Posts  (with post_tags + post_media, user_id is student_id string)
        # ---------------------------------------------------------------
        p1 = PostModel(
            title="Autonomous Solar Rover Ecosystem",
            description="An automated navigation and battery-monitoring array utilizing lightweight RTOS microkernels.",
            post_type="project",
            status="published",
            club_id=c3.id,
        )
        p2 = PostModel(
            title="ByteCraft Hackathon — Registration Now Open!",
            description="Register your team for the biggest hackathon of the year. Limited spots available!",
            post_type="announcement",
            status="published",
            club_id=c1.id,
        )
        p3 = PostModel(
            title="My Journey Learning Figma in 30 Days",
            description="Here's what I learned about auto-layout, component variants, and design tokens over 30 days of daily practice.",
            post_type="post",
            status="published",
            user_id=u2.student_id,
        )
        p4 = PostModel(
            title="Draft: New Project Proposal",
            description="Working on a drone delivery prototype — still in draft stage.",
            post_type="project",
            status="draft",
            user_id=u1.student_id,
        )
        db.add_all([p1, p2, p3, p4])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)
        db.refresh(p4)

        # Tags
        db.add_all([
            PostTagModel(post_id=p1.id, value="Hardware"),
            PostTagModel(post_id=p1.id, value="C++"),
            PostTagModel(post_id=p1.id, value="RTOS"),
            PostTagModel(post_id=p2.id, value="Hackathon"),
            PostTagModel(post_id=p2.id, value="AI"),
            PostTagModel(post_id=p3.id, value="Design"),
            PostTagModel(post_id=p3.id, value="Figma"),
            PostTagModel(post_id=p4.id, value="Hardware"),
            PostTagModel(post_id=p4.id, value="Drone"),
        ])

        # Media
        db.add_all([
            PostMediaModel(post_id=p1.id, media_type="photo", file_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80", display_order=0),
            PostMediaModel(post_id=p2.id, media_type="photo", file_url="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80", display_order=0),
            PostMediaModel(post_id=p3.id, media_type="photo", file_url="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80", display_order=0),
        ])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)

        # ---------------------------------------------------------------
        # Comments & Reactions
        # ---------------------------------------------------------------
        c_root1 = CommentModel(post_id=p1.id, user_id=u2.student_id, content="This is amazing work! How did you handle the power management?")
        c_root2 = CommentModel(post_id=p3.id, user_id=u1.student_id, content="Great writeup Sarah! Auto-layout changed my workflow completely.")
        db.add_all([c_root1, c_root2])
        db.commit()
        db.refresh(c_root1)

        # Reply to root comment
        db.add(CommentModel(post_id=p1.id, user_id=u1.student_id, parent_id=c_root1.id, content="We used a custom PWM controller with a solar charge IC — happy to share the circuit diagram!"))
        db.commit()

        # Reactions
        db.add_all([
            PostReactionModel(post_id=p1.id, user_id=u2.student_id, reaction_type="fire"),
            PostReactionModel(post_id=p1.id, user_id=u3.student_id, reaction_type="clap"),
            PostReactionModel(post_id=p3.id, user_id=u1.student_id, reaction_type="heart"),
            PostReactionModel(post_id=p2.id, user_id=u3.student_id, reaction_type="like"),
        ])
        db.commit()

        print("[Init DB] Seed data inserted successfully.")
    except Exception as e:
        db.rollback()
        print(f"[Init DB Error] Failed to seed database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
