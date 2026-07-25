"""Create the CampusForge database schema with explicit raw SQL statements.

This module intentionally uses DB-API calls rather than ORM metadata so the
schema remains easy to inspect and explain in a DBMS project presentation.
"""

from database import connection

SCHEMA_STATEMENTS = (
    """
    CREATE TABLE IF NOT EXISTS user (
        student_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        profile_pic TEXT,
        bio TEXT,
        socials TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS skills (
        user_id TEXT NOT NULL REFERENCES user(student_id) ON DELETE CASCADE,
        skill TEXT NOT NULL,
        skill_level TEXT NOT NULL DEFAULT 'Beginner',
        PRIMARY KEY (user_id, skill)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS club (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS club_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER NOT NULL REFERENCES club(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(student_id) ON DELETE CASCADE,
        role TEXT DEFAULT 'Member',
        status TEXT DEFAULT 'approved',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (club_id, user_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        event_type TEXT DEFAULT 'workshop',
        status TEXT DEFAULT 'upcoming',
        start_time TEXT NOT NULL,
        end_time TEXT,
        club_id INTEGER REFERENCES club(id) ON DELETE CASCADE,
        tags TEXT,
        results TEXT,
        details TEXT,
        settings TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS event_registrants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(student_id) ON DELETE CASCADE,
        role TEXT DEFAULT 'Participant',
        status TEXT DEFAULT 'approved',
        team_name TEXT,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (event_id, user_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        post_type TEXT NOT NULL DEFAULT 'post',
        status TEXT NOT NULL DEFAULT 'published',
        user_id TEXT REFERENCES user(student_id) ON DELETE CASCADE,
        club_id INTEGER REFERENCES club(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        value TEXT NOT NULL,
        PRIMARY KEY (post_id, value)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS post_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(student_id) ON DELETE CASCADE,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS post_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(student_id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL DEFAULT 'like',
        UNIQUE (post_id, user_id)
    )
    """,
)


def init_db() -> None:
    """Create each table if it does not already exist."""
    with connection() as db:
        for statement in SCHEMA_STATEMENTS:
            db.execute(statement)

    print("[Init DB] Raw SQL schema is ready.")
