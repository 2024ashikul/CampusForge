
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
        description TEXT NOT NULL,
        event_type TEXT DEFAULT 'workshop',
        status TEXT DEFAULT 'upcoming',
        start_time TEXT NOT NULL,
        end_time TEXT,
        club_id INTEGER REFERENCES club(id) ON DELETE CASCADE,
        tags TEXT,
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
        statements = MYSQL_SCHEMA_STATEMENTS if db.mysql else SCHEMA_STATEMENTS
        for statement in statements:
            db.execute(statement)

    print("[Init DB] Raw SQL schema is ready.")
MYSQL_SCHEMA_STATEMENTS = (
    """CREATE TABLE IF NOT EXISTS user (
        student_id VARCHAR(20) PRIMARY KEY, name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
        profile_pic TEXT NULL, bio TEXT NULL, socials JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS skills (
        user_id VARCHAR(20) NOT NULL, skill VARCHAR(100) NOT NULL,
        skill_level VARCHAR(20) NOT NULL DEFAULT 'Beginner',
        PRIMARY KEY (user_id, skill), FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS club (
        id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL, details JSON NULL, settings JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY, club_id INT NOT NULL, user_id VARCHAR(20) NOT NULL,
        role VARCHAR(40) NOT NULL DEFAULT 'Member', status VARCHAR(20) NOT NULL DEFAULT 'approved',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY club_member_unique (club_id, user_id),
        FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
        event_type VARCHAR(50) NOT NULL DEFAULT 'workshop', status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
        start_time VARCHAR(64) NOT NULL, end_time VARCHAR(64) NULL, club_id INT NULL,
        tags JSON NULL, details JSON NULL, settings JSON NULL,
        FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS event_registrants (
        id INT AUTO_INCREMENT PRIMARY KEY, event_id INT NOT NULL, user_id VARCHAR(20) NOT NULL,
        role VARCHAR(40) NOT NULL DEFAULT 'Participant', status VARCHAR(20) NOT NULL DEFAULT 'approved',
        team_name VARCHAR(255) NULL, registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY event_user_unique (event_id, user_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
        post_type VARCHAR(50) NOT NULL DEFAULT 'post', status VARCHAR(30) NOT NULL DEFAULT 'published',
        user_id VARCHAR(20) NULL, club_id INT NULL, event_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE,
        FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS post_tags (
        post_id INT NOT NULL, value VARCHAR(100) NOT NULL, PRIMARY KEY (post_id, value),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS post_media (
        id INT AUTO_INCREMENT PRIMARY KEY, media_type VARCHAR(20) NOT NULL, file_url TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 0, post_id INT NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY, post_id INT NOT NULL, user_id VARCHAR(20) NOT NULL,
        parent_id INT NULL, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
    """CREATE TABLE IF NOT EXISTS post_reactions (
        id INT AUTO_INCREMENT PRIMARY KEY, post_id INT NOT NULL, user_id VARCHAR(20) NOT NULL,
        reaction_type VARCHAR(20) NOT NULL DEFAULT 'like', UNIQUE KEY post_user_reaction (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB""",
)
