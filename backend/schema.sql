CREATE TABLE [user] (
	[id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[name] NVARCHAR(255) NOT NULL,
	[email] NVARCHAR(255) NOT NULL UNIQUE,
	[password] NVARCHAR(255) NOT NULL,
	[profile_pic] NVARCHAR(500) NULL,
	[department] NVARCHAR(255) NOT NULL,
	[created_at] DATETIME DEFAULT GETDATE()
);

CREATE TABLE [club] (
	[id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[title] NVARCHAR(255) NOT NULL,
	[description] NVARCHAR(MAX) NOT NULL,
	[created_at] DATETIME DEFAULT GETDATE()
);

-- Unified Posts Table (Handles Projects, Announcements, & General Feeds)
CREATE TABLE [posts] (
	[id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[title] NVARCHAR(255) NOT NULL,
	[description] NVARCHAR(MAX) NOT NULL,
	[post_type] NVARCHAR(50) NOT NULL DEFAULT 'general', -- 'project', 'announcement', 'general'
	[status] NVARCHAR(50) NOT NULL DEFAULT 'published',   -- 'draft', 'published', 'archived'
	[user_id] INT NULL,
	[club_id] INT NULL,
	[created_at] DATETIME DEFAULT GETDATE(),
	FOREIGN KEY ([user_id]) REFERENCES [user]([id]) ON DELETE CASCADE,
	FOREIGN KEY ([club_id]) REFERENCES [club]([id]) ON DELETE CASCADE
);