

# CampusForge


![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.x-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)

**CampusForge** is an Academic Skills and Collaboration Platform built for university students. This repository contains the source code for a comprehensive University Database Management System (DBMS) course project. It enables students to form clubs, manage events, share skills, and collaborate effectively.

## Features

- **Student Authentication:** Registration and login using a 7-digit student ID (YYPPNNN format, auto-derives department).
- **Club Management:** Create, join, and manage campus clubs with roles (Admin, Moderator, Member).
- **Event Management:** Host workshops, competitions, seminars, and guest speakers. Supports team-based registration (max 4 members).
- **Social Feed:** Share posts, projects, and announcements. Features post reactions (heart, like, fire, clap) and threaded comments.
- **Skills Directory:** Browse and find students across the campus by specific skills.
- **File Management:** Upload images, videos, and documents (up to 10MB).
- **Notifications:** Email notifications via SMTP for club and event announcements.
- **UI Experience:** Built-in Dark/Light theme toggle.
- **Data Export/Import:** CSV/Excel result import for event competitions.
- **Access Control:** Role-based access control for Admins, Moderators, Members, and Participants.

## Tech Stack

**Backend**
- Python 3 + FastAPI
- SQLAlchemy ORM
- Database: SQLite (Development) / MySQL (Production)
- Auth: JWT (JSON Web Tokens)

**Frontend**
- React 19 + TypeScript + Vite 8
- Styling: Tailwind CSS 4, Lucide React (Icons)
- Markdown: `react-md-editor`, `react-markdown`
- Data Export: PapaParse (CSV), SheetJS (Excel)

## Project Structure

```text
CampusForge/
├── backend/                 # FastAPI application
│   ├── main.py              # Application entry point
│   ├── database.py          # Database connections
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation
│   ├── routers/             # API endpoints
│   └── ...
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application views
│   │   ├── services/        # API integrations
│   │   └── ...
│   └── ...
├── start.sh                 # One-click launch script
└── README.md
```

## Database Structure
The application utilizes an 11-table relational database schema:
- `user`, `skills`, `club`, `club_members`, `events`, `event_registrants`, `posts`, `post_tags`, `post_media`, `comments`, `post_reactions`

## API Overview
Over 40 RESTful endpoints organized across 9 routers:
- `/api/auth` — Authentication and token management
- `/api/users` — User profiles and relationships
- `/api/skills` — Skills directory
- `/api/clubs` — Club and member management
- `/api/events` — Events, registrations, and results
- `/api/posts` — Social feed and announcements
- `/api/posts/{id}/comments` — Threaded discussions
- `/api/posts/{id}/reactions` — Social reactions
- `/api/uploads` — File handling

## Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server (runs on http://localhost:8000):
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *API documentation will be available at http://localhost:8000/docs*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs on http://localhost:5173):
   ```bash
   npm run dev
   ```

### Quick Start
Alternatively, you can launch both backend and frontend simultaneously using the provided shell script:
```bash
./start.sh
```

## Environment Variables
Copy `backend/.env.example` to `backend/.env` to configure the application.

- **Database:** `DATABASE_URL`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`
- **Security:** `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60), `REFRESH_TOKEN_EXPIRE_DAYS` (default: 7)
- **Email Notifications (Optional):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_USE_TLS`
*(If SMTP is not configured, announcements are still created but emails are bypassed).*

## Seed Data / Demo Accounts
On the first run, the database automatically seeds 3 sample users (Password for all: `password123`):
- **Alex Rivera** (ID: 2604001) — CSE
- **Sarah Chen** (ID: 2607001) — Architecture
- **Marcus Vance** (ID: 2602001) — Mechanical Engineering

## Documentation

For the complete project documentation (including detailed database schema, ER diagrams, normalization analysis, API reference, and data flow walkthroughs), see:

📄 **[Project Documentation](docs/PROJECT_DOCUMENTATION.md)**

## License

This project is licensed under the MIT License — Copyright 2026 Ashikul Islam.
