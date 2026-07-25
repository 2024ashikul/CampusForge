import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Keep this in sync with the attachment picker. HEIC/HEIF and common video
# formats are frequently selected from phones and desktops, not just cameras.
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".heic", ".heif", ".mp4", ".webm", ".mov", ".avi", ".mkv", ".3gp", ".pdf", ".doc", ".docx", ".csv", ".xls", ".xlsx", ".txt", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


@router.post("/file")
def upload_file(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {ext} not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 10MB)")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Return an absolute URL. The frontend runs on a different port, so a
    # relative /uploads URL would otherwise point at Vite instead of FastAPI.
    url = str(request.base_url).rstrip("/") + f"/uploads/{filename}"
    return {"url": url, "filename": filename}
