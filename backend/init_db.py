import json
from database import engine, SessionLocal, Base
from models import UserModel, ClubModel, PostModel, EventModel, ClubMemberModel, EventRegistrantModel
from auth import get_password_hash

def init_db():
    print("[Init DB] Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(UserModel).first():
            print("[Init DB] Database already contains data.")
            return

        print("[Init DB] Seeding initial sample data...")

        # Create Users with Skills
        u1 = UserModel(
            name="Alex Rivera",
            email="alex.rivera@campusforge.edu",
            password=get_password_hash("password123"),
            department="Computer Science",
            profile_pic="👨‍💻",
            bio="Systems engineering enthusiast and platform developer.",
            skills=json.dumps([
                {"name": "Python", "level": "Advanced"},
                {"name": "React", "level": "Intermediate"},
                {"name": "C++", "level": "Beginner"},
                {"name": "RTOS", "level": "Advanced"}
            ]),
            is_active=1
        )
        u2 = UserModel(
            name="Sarah Chen",
            email="sarah.chen@campusforge.edu",
            password=get_password_hash("password123"),
            department="Design Architecture",
            profile_pic="👩‍💻",
            bio="UI/UX design architect and web developer.",
            skills=json.dumps([
                {"name": "UI/UX Design", "level": "Advanced"},
                {"name": "Figma", "level": "Advanced"},
                {"name": "TypeScript", "level": "Intermediate"},
                {"name": "Tailwind CSS", "level": "Advanced"}
            ]),
            is_active=1
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        # Create Clubs with entry fees & categories
        c1 = ClubModel(
            title="Google Developer Student Club",
            description="The premier technical collective for scaling software products, exploring AI tooling, and building community ecosystems.",
            category="technical",
            is_recruiting=1,
            join_format="interview",
            membership_fee="free",
            lead_name="Alex Rivera",
            tags=json.dumps(["Web3", "AI", "Cloud", "Open Source"]),
            base_department="Computer Science"
        )
        c2 = ClubModel(
            title="Pixel Perfect Design Club",
            description="Crafting pixel-perfect interface components, establishing unified design tokens, and hosting multi-campus Figma hackathons.",
            category="technical",
            is_recruiting=1,
            join_format="portfolio-review",
            membership_fee="$10",
            lead_name="Sarah Chen",
            tags=json.dumps(["UI/UX", "Figma", "Product Design"]),
            base_department="Design Architecture"
        )
        c3 = ClubModel(
            title="Robotics & Automation Society",
            description="Designing high-performance mechanical systems, firmware control loops, and autonomous EV prototypes.",
            category="technical",
            is_recruiting=0,
            join_format="interview",
            membership_fee="free",
            lead_name="Marcus Vance",
            tags=json.dumps(["EV", "Hardware", "ROS", "Firmware"]),
            base_department="Mechanical & Electrical"
        )
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)

        # Seed Club Membership
        m1 = ClubMemberModel(club_id=c1.id, user_id=u1.id, role="Lead Chapter", payment_status="free")
        m2 = ClubMemberModel(club_id=c2.id, user_id=u2.id, role="Design Director", payment_status="completed", payment_method="Demo Credit Card")
        db.add_all([m1, m2])
        db.commit()

        # Create Events
        e1 = EventModel(
            title="ByteCraft Hackathon 2026",
            short_description="The ultimate campus-wide 36-hour hackathon targeting web3 and sustainability paradigms.",
            description_markdown="### Welcome to ByteCraft 2026\n\nBuild innovative solutions using cutting-edge APIs.",
            event_type="competition",
            status="upcoming",
            participation_type="team",
            entrance_fee="free",
            date="May 28, 2026",
            time="09:00 AM",
            location="Main Auditorium & Discord",
            virtual_link="https://discord.gg/campusforge-bytecraft",
            club_id=c1.id,
            tags=json.dumps(["Next.js", "Hackathon", "Web3", "AI"]),
            image_url="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80"
        )
        e2 = EventModel(
            title="UI/UX Design Systems Mastery",
            short_description="Construct complex, highly scalable atomic design components and interactive tokens in Figma.",
            description_markdown="### Advanced Component Architecture Workshop\n\nHands-on token mapping and Figma auto-layout exercises.",
            event_type="workshop",
            status="upcoming",
            participation_type="individual",
            entrance_fee="$15",
            date="Jun 05, 2026",
            time="02:30 PM",
            location="Design Lab 3",
            club_id=c2.id,
            tags=json.dumps(["Design", "Figma", "UI/UX"]),
            image_url="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80"
        )
        e3 = EventModel(
            title="Embedded RTOS & Microkernel Architecture",
            short_description="Hands-on flashing of deterministic tasks onto real-time sensor array kits.",
            description_markdown="Flashing real-time microkernel OS on hardware boards.",
            event_type="workshop",
            status="upcoming",
            participation_type="individual",
            entrance_fee="free",
            date="Jun 12, 2026",
            time="10:00 AM",
            location="Lab 4, Engineering Core",
            club_id=c3.id,
            tags=json.dumps(["Hardware", "C++", "RTOS"]),
            image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
        )
        db.add_all([e1, e2, e3])
        db.commit()

        # Seed Event Registration
        reg1 = EventRegistrantModel(event_id=e1.id, user_id=u1.id, team_name="CyberCraft Team", payment_status="free")
        db.add_all([reg1])
        db.commit()

        # Create Posts
        p1 = PostModel(
            title="Autonomous Solar Rover Ecosystem",
            description="An automated navigation and battery-monitoring array utilizing lightweight RTOS microkernels.",
            post_type="project",
            status="published",
            club_id=c3.id,
            tags=json.dumps(["Hardware", "C++", "RTOS"]),
            attachments=json.dumps([
                {"type": "PHOTO", "url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
            ])
        )
        db.add(p1)
        db.commit()

        print("[Init DB] Seed data inserted successfully with clubs, events, and registrations.")
    except Exception as e:
        db.rollback()
        print(f"[Init DB Error] Failed to seed database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
