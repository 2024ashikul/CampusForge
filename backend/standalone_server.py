import http.server
import json
import socketserver
import sqlite3
import urllib.parse

PORT = 8000
DB_FILE = "campusforge.db"


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            profile_pic TEXT,
            department TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS club (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            post_type TEXT NOT NULL DEFAULT 'general',
            status TEXT NOT NULL DEFAULT 'published',
            user_id INTEGER,
            club_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
            FOREIGN KEY (club_id) REFERENCES club(id) ON DELETE CASCADE
        );
    """)

    
    cursor.execute("SELECT COUNT(*) FROM user")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO user (name, email, password, department, profile_pic) VALUES (?, ?, ?, ?, ?)",
            ("Alex Rivera", "alex.rivera@campusforge.edu", "pass123", "Computer Science", "👨‍💻"),
        )
        cursor.execute(
            "INSERT INTO user (name, email, password, department, profile_pic) VALUES (?, ?, ?, ?, ?)",
            ("Sarah Chen", "sarah.chen@campusforge.edu", "pass456", "Design Architecture", "👩‍💻"),
        )

        cursor.execute(
            "INSERT INTO club (title, description) VALUES (?, ?)",
            (
                "Google Developer Student Club",
                "The premier technical collective for scaling software products and AI.",
            ),
        )
        cursor.execute(
            "INSERT INTO club (title, description) VALUES (?, ?)",
            (
                "Robotics & Automation Society",
                "Designing high-performance mechanical systems and firmware control loops.",
            ),
        )

        cursor.execute(
            "INSERT INTO posts (title, description, post_type, status, club_id) VALUES (?, ?, ?, ?, ?)",
            (
                "Autonomous Solar Rover Ecosystem",
                "An automated navigation array utilizing lightweight RTOS microkernels.",
                "project",
                "published",
                2,
            ),
        )
        cursor.execute(
            "INSERT INTO posts (title, description, post_type, status, user_id) VALUES (?, ?, ?, ?, ?)",
            (
                "Architecting Zero-Allocation Buffers in Go",
                "Bypassing the heap allocator by recycling arrays via local synchronization pools.",
                "general",
                "published",
                2,
            ),
        )
        cursor.execute(
            "INSERT INTO posts (title, description, post_type, status, club_id) VALUES (?, ?, ?, ?, ?)",
            (
                "Upcoming Inter-Departmental Hackathon",
                "Join us this weekend at the Advanced Computing Lab for 24 hours of rapid prototyping!",
                "announcement",
                "published",
                1,
            ),
        )

    conn.commit()
    conn.close()


class CampusForgeHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def respond_json(self, data, status=200):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if path in ["/", "/api", "/api/health"]:
            self.respond_json({"status": "ok", "service": "CampusForge Backend API"})
        elif path == "/api/users":
            cursor.execute("SELECT id, name, email, department, profile_pic, created_at FROM user")
            rows = [dict(r) for r in cursor.fetchall()]
            self.respond_json(rows)
        elif path == "/api/clubs":
            cursor.execute("SELECT id, title, description, created_at FROM club")
            rows = [dict(r) for r in cursor.fetchall()]
            self.respond_json(rows)
        elif path == "/api/posts":
            post_type = query.get("post_type", [None])[0]
            club_id = query.get("club_id", [None])[0]
            user_id = query.get("user_id", [None])[0]

            sql = "SELECT p.*, u.name as user_name, c.title as club_title FROM posts p LEFT JOIN user u ON p.user_id = u.id LEFT JOIN club c ON p.club_id = c.id WHERE 1=1"
            params = []
            if post_type:
                sql += " AND p.post_type = ?"
                params.append(post_type)
            if club_id:
                sql += " AND p.club_id = ?"
                params.append(int(club_id))
            if user_id:
                sql += " AND p.user_id = ?"
                params.append(int(user_id))

            sql += " ORDER BY p.created_at DESC"
            cursor.execute(sql, params)
            rows = []
            for r in cursor.fetchall():
                row_dict = dict(r)
                row_dict["author_name"] = (
                    r["club_title"] if r["club_title"] else (r["user_name"] or "Anonymous")
                )
                row_dict["author_association"] = "CLUB" if r["club_id"] else "STUDENT"
                rows.append(row_dict)

            self.respond_json(rows)
        else:
            self.respond_json({"detail": "Not Found"}, status=404)

        conn.close()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(body) if body else {}

        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if path == "/api/posts":
            title = data.get("title", "Untitled")
            description = data.get("description", "")
            post_type = data.get("post_type", "general")
            status_val = data.get("status", "published")
            user_id = data.get("user_id")
            club_id = data.get("club_id")

            cursor.execute(
                "INSERT INTO posts (title, description, post_type, status, user_id, club_id) VALUES (?, ?, ?, ?, ?, ?)",
                (title, description, post_type, status_val, user_id, club_id),
            )
            conn.commit()
            new_id = cursor.lastrowid

            cursor.execute(
                "SELECT p.*, u.name as user_name, c.title as club_title FROM posts p LEFT JOIN user u ON p.user_id = u.id LEFT JOIN club c ON p.club_id = c.id WHERE p.id = ?",
                (new_id,),
            )
            r = cursor.fetchone()
            row_dict = dict(r)
            row_dict["author_name"] = (
                r["club_title"] if r["club_title"] else (r["user_name"] or "Anonymous")
            )
            row_dict["author_association"] = "CLUB" if r["club_id"] else "STUDENT"

            self.respond_json(row_dict, status=201)
        elif path == "/api/clubs":
            title = data.get("title", "Untitled Club")
            description = data.get("description", "")

            cursor.execute(
                "INSERT INTO club (title, description) VALUES (?, ?)", (title, description)
            )
            conn.commit()
            new_id = cursor.lastrowid

            cursor.execute(
                "SELECT id, title, description, created_at FROM club WHERE id = ?", (new_id,)
            )
            self.respond_json(dict(cursor.fetchone()), status=201)
        else:
            self.respond_json({"detail": "Not Found"}, status=404)

        conn.close()


if __name__ == "__main__":
    init_db()
    print(f"[CampusForge Server] Running on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), CampusForgeHandler) as httpd:
        httpd.serve_forever()
