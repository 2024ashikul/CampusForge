-- =============================================================================
-- CampusForge Reference Schema  v3.0
-- Engine: SQLite (dev) / MySQL (prod)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user
-- student_id format: YYPPNNN
--   YY = 2-digit batch year
--   PP = department code (01=Civil, 02=Mech, 03=Electrical, 04=CSE,
--                         05=ECE, 06=Chemical, 07=Architecture,
--                         08=BBA, 09=English, 10=Math&Physics)
--   NNN = 3-digit sequential id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [user] (
    [id]          INTEGER PRIMARY KEY AUTOINCREMENT,
    [student_id]  TEXT    NOT NULL UNIQUE,   -- e.g. 2604001
    [name]        TEXT    NOT NULL,
    [email]       TEXT    NOT NULL UNIQUE,
    [password]    TEXT    NOT NULL,
    [profile_pic] TEXT,
    [bio]         TEXT,
    [is_active]   INTEGER NOT NULL DEFAULT 0,
    [department]  TEXT    NOT NULL,          -- auto-derived from student_id
    [skills]      TEXT,                      -- JSON: [{"name": str, "level": str}]
    [socials]     TEXT,                      -- JSON: {"github": "...", "linkedin": "...", ...}
    [created_at]  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- club
-- details JSON: {"founded": str, "lead_name": str, "base_department": str,
--                "category": str, "image_url": str}
-- settings JSON: {"is_recruiting": bool, "join_format": str,
--                 "membership_fee": str, "is_results_public": bool,
--                 "is_open": bool, "payment_fee": number}
-- join_format: 'open' | 'interview' | 'portfolio-review'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [club] (
    [id]          INTEGER PRIMARY KEY AUTOINCREMENT,
    [title]       TEXT    NOT NULL,
    [description] TEXT    NOT NULL,
    [details]     TEXT,    -- JSON blob
    [settings]    TEXT,    -- JSON blob
    [created_at]  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- club_members
-- role: 'Admin' | 'Moderator' | 'Member'
-- status: 'approved' | 'pending'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [club_members] (
    [id]             INTEGER PRIMARY KEY AUTOINCREMENT,
    [club_id]        INTEGER NOT NULL REFERENCES [club]([id]) ON DELETE CASCADE,
    [user_id]        INTEGER NOT NULL REFERENCES [user]([id]) ON DELETE CASCADE,
    [role]           TEXT    NOT NULL DEFAULT 'Member',
    [status]         TEXT    NOT NULL DEFAULT 'approved',
    [payment_status] TEXT    NOT NULL DEFAULT 'completed',
    [payment_method] TEXT,
    [joined_at]      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- events
-- details JSON: {"location": str, "image_url": str,
--                "virtual_link": str, "description_markdown": str}
-- settings JSON: {"participation_type": str, "entrance_fee": str,
--                 "is_attendees_public": bool, "is_results_public": bool}
-- event_type: 'workshop' | 'competition' | 'guest-speaker' | 'seminar'
-- status: 'upcoming' | 'ongoing' | 'completed'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [events] (
    [id]                INTEGER PRIMARY KEY AUTOINCREMENT,
    [title]             TEXT    NOT NULL,
    [short_description] TEXT    NOT NULL,
    [event_type]        TEXT    NOT NULL DEFAULT 'workshop',
    [status]            TEXT    NOT NULL DEFAULT 'upcoming',
    [date]              TEXT    NOT NULL,
    [time]              TEXT    NOT NULL,
    [club_id]           INTEGER REFERENCES [club]([id]) ON DELETE CASCADE,
    [tags]              TEXT,              -- JSON array
    [results]           TEXT,             -- JSON or markdown
    [details]           TEXT,             -- JSON blob
    [settings]          TEXT,             -- JSON blob
    [created_at]        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- event_registrants
-- role: 'Admin' | 'Participant'
-- status: 'approved' | 'pending'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [event_registrants] (
    [id]             INTEGER PRIMARY KEY AUTOINCREMENT,
    [event_id]       INTEGER NOT NULL REFERENCES [events]([id]) ON DELETE CASCADE,
    [user_id]        INTEGER NOT NULL REFERENCES [user]([id]) ON DELETE CASCADE,
    [role]           TEXT    NOT NULL DEFAULT 'Participant',
    [status]         TEXT    NOT NULL DEFAULT 'approved',
    [team_name]      TEXT,
    [payment_status] TEXT    NOT NULL DEFAULT 'completed',
    [payment_method] TEXT,
    [registered_at]  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- posts
-- post_type: 'post' (feed) | 'project' (showcase) | 'announcement' (club/event)
-- status: 'draft' | 'published' | 'archived'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [posts] (
    [id]          INTEGER PRIMARY KEY AUTOINCREMENT,
    [title]       TEXT    NOT NULL,
    [description] TEXT    NOT NULL,
    [post_type]   TEXT    NOT NULL DEFAULT 'post',
    [status]      TEXT    NOT NULL DEFAULT 'published',
    [user_id]     INTEGER REFERENCES [user]([id]) ON DELETE CASCADE,
    [club_id]     INTEGER REFERENCES [club]([id]) ON DELETE CASCADE,
    [event_id]    INTEGER REFERENCES [events]([id]) ON DELETE CASCADE,
    [created_at]  DATETIME DEFAULT CURRENT_TIMESTAMP,
    [updated_at]  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- post_tags   (post_id + value = composite PK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [post_tags] (
    [post_id] INTEGER NOT NULL REFERENCES [posts]([id]) ON DELETE CASCADE,
    [value]   TEXT    NOT NULL,
    PRIMARY KEY ([post_id], [value])
);

-- ---------------------------------------------------------------------------
-- post_media
-- media_type: 'photo' | 'video' | 'link'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [post_media] (
    [id]            INTEGER PRIMARY KEY AUTOINCREMENT,
    [post_id]       INTEGER NOT NULL REFERENCES [posts]([id]) ON DELETE CASCADE,
    [media_type]    TEXT    NOT NULL,
    [file_url]      TEXT    NOT NULL,
    [display_order] INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- comments   (1-level threading: parent_id=NULL = root, parent_id=id = reply)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [comments] (
    [id]         INTEGER PRIMARY KEY AUTOINCREMENT,
    [post_id]    INTEGER NOT NULL REFERENCES [posts]([id]) ON DELETE CASCADE,
    [user_id]    INTEGER NOT NULL REFERENCES [user]([id]) ON DELETE CASCADE,
    [parent_id]  INTEGER REFERENCES [comments]([id]) ON DELETE CASCADE,
    [content]    TEXT    NOT NULL,
    [created_at] DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- post_reactions
-- reaction_type: 'heart' | 'like' | 'fire' | 'clap'
-- Unique constraint: one reaction per user per post
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [post_reactions] (
    [id]            INTEGER PRIMARY KEY AUTOINCREMENT,
    [post_id]       INTEGER NOT NULL REFERENCES [posts]([id]) ON DELETE CASCADE,
    [user_id]       INTEGER NOT NULL REFERENCES [user]([id]) ON DELETE CASCADE,
    [reaction_type] TEXT    NOT NULL DEFAULT 'like',
    UNIQUE ([post_id], [user_id])
);

-- ---------------------------------------------------------------------------
-- email_verification
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS [email_verification] (
    [id]         INTEGER PRIMARY KEY AUTOINCREMENT,
    [user_id]    INTEGER NOT NULL REFERENCES [user]([id]) ON DELETE CASCADE,
    [token]      TEXT    NOT NULL UNIQUE,
    [expires_at] DATETIME NOT NULL
);
