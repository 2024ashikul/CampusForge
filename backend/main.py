from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, clubs, posts, auth, events
from init_db import init_db

app = FastAPI(
    title="CampusForge API",
    description="FastAPI Backend for CampusForge — JWT-authenticated campus platform.",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(clubs.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(posts.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    print("[CampusForge Backend] Initializing database...")
    init_db()


@app.get("/")
def root():
    return {
        "message": "CampusForge FastAPI Backend Running",
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CampusForge Backend API"}
