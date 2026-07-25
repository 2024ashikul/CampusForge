import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from init_db import init_db
from routers import auth, clubs, comments, events, posts, reactions, skills, uploads, users

app = FastAPI(
    title="CampusForge API",
    description="FastAPI Backend for CampusForge — JWT-authenticated campus platform.",
    version="3.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(clubs.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(reactions.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    print("[CampusForge Backend] Initializing database...")
    init_db()


@app.get("/")
def root():
    return {
        "message": "CampusForge FastAPI Backend Running",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CampusForge Backend API", "version": "3.0.0"}
