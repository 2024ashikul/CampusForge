import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Environment variable or default MySQL connection parameters
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "campusforge")

MYSQL_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
)

# SQLite fallback URL for local execution if MySQL engine fails
SQLITE_DATABASE_URL = "sqlite:///./campusforge.db"

def get_db_engine():
    """Try to initialize MySQL connection, fall back to SQLite if MySQL is unavailable."""
    try:
        engine = create_engine(MYSQL_DATABASE_URL, pool_pre_ping=True)
        # Verify connection
        with engine.connect() as conn:
            pass
        print(f"[DB Info] Successfully connected to MySQL at {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}")
        return engine
    except Exception as e:
        print(f"[DB Warning] Could not connect to MySQL ({e}). Using local SQLite database fallback.")
        return create_engine(
            SQLITE_DATABASE_URL,
            connect_args={"check_same_thread": False}
        )

engine = get_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
