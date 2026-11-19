import os
import uuid
import re
import subprocess
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from PIL import Image, ImageOps

from backend.app.auth import require_admin, require_barber_or_admin
from backend.app.models import User

router = APIRouter(prefix="/api/media", tags=["Gestión de Medios & Galería"])

# Base directory for uploads (Project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOADS_ROOT = os.getenv("UPLOADS_DIR", os.path.join(BASE_DIR, "uploads"))

VALID_FOLDERS = ["banner", "galeria", "equipo", "videos", "sistema", "favicon"]

# Max dimension widths per folder for WebP optimization
MAX_WIDTHS = {
    "banner": 1920,
    "galeria": 1400,
    "equipo": 800,
    "sistema": 512,
    "videos": 1920
}

def sanitize_filename(name: str) -> str:
    name = re.sub(r"[^\w\-.]", "_", name)
    return name.lower()

def optimize_image(input_bytes: bytes, folder: str, original_filename: str) -> tuple[str, int]:
    """
    Opens image, corrects EXIF orientation, resizes proportionally,
    and encodes to ultra-fast modern WebP format.
    Returns (filename, size_kb).
    """
    import io
    image = Image.open(io.BytesIO(input_bytes))
    
    # Auto-orient based on EXIF
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # Resize proportionally if width exceeds limit
    max_w = MAX_WIDTHS.get(folder, 1400)
    w, h = image.size
    if w > max_w:
        ratio = max_w / float(w)
        new_h = int(float(h) * float(ratio))
        image = image.resize((max_w, new_h), Image.Resampling.LANCZOS)

    # Maintain alpha transparency if present (RGBA) or convert to RGB
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        image = image.convert("RGBA")
    else:
        image = image.convert("RGB")

    # Generate unique clean name
    base_name = os.path.splitext(sanitize_filename(original_filename))[0][:30]
    unique_id = uuid.uuid4().hex[:8]
    webp_filename = f"{base_name}_{unique_id}.webp"

    dest_folder = os.path.join(UPLOADS_ROOT, folder)
    os.makedirs(dest_folder, exist_ok=True)
    dest_path = os.path.join(dest_folder, webp_filename)

    # Save as high-efficiency WebP
    image.save(dest_path, "WEBP", quality=82, method=4)
    size_kb = int(os.path.getsize(dest_path) / 1024)
    return webp_filename, size_kb

def process_favicon(input_bytes: bytes, original_filename: str) -> tuple[str, int]:
    """
    Crops image to a 1:1 square, resizes to multi-resolution standard favicon sizes,
    and encodes it into an ultra-compact .ico file (< 6 KB) placed in uploads/sistema/.
    Returns (filename, size_kb).
    """
    import io
    image = Image.open(io.BytesIO(input_bytes))
    
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    if image.mode != "RGBA":
        image = image.convert("RGBA")

    w, h = image.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    square_img = image.crop((left, top, left + min_dim, top + min_dim))

    base_name = os.path.splitext(sanitize_filename(original_filename))[0][:20] or "favicon"
    unique_id = uuid.uuid4().hex[:8]
    ico_filename = f"favicon_{base_name}_{unique_id}.ico"

    dest_folder = os.path.join(UPLOADS_ROOT, "sistema")
    os.makedirs(dest_folder, exist_ok=True)
    dest_path = os.path.join(dest_folder, ico_filename)

    # Save multi-resolution standard ICO: 48x48 (Retina), 32x32 (standard), 16x16 (tab)
    square_img.save(dest_path, format="ICO", sizes=[(48, 48), (32, 32), (16, 16)])
    size_bytes = os.path.getsize(dest_path)
    size_kb = max(1, int(size_bytes / 1024))
    return ico_filename, size_kb

def process_video(file_bytes: bytes, original_filename: str) -> tuple[str, int]:
    """
    Saves video to uploads/videos and attempts WebM conversion via ffmpeg if available.
    """
    base_name = os.path.splitext(sanitize_filename(original_filename))[0][:30]
    unique_id = uuid.uuid4().hex[:8]
    dest_folder = os.path.join(UPLOADS_ROOT, "videos")
    os.makedirs(dest_folder, exist_ok=True)

    temp_path = os.path.join(dest_folder, f"temp_{unique_id}_{original_filename}")
    with open(temp_path, "wb") as f:
        f.write(file_bytes)

    target_filename = f"{base_name}_{unique_id}.webm"
    target_path = os.path.join(dest_folder, target_filename)

    # Check for ffmpeg
    ffmpeg_bin = "/opt/homebrew/bin/ffmpeg" if os.path.exists("/opt/homebrew/bin/ffmpeg") else "ffmpeg"
    try:
        # Re-encode to optimized WebM VP9 or VP8
        cmd = [
            ffmpeg_bin, "-y", "-i", temp_path,
            "-c:v", "libvpx", "-b:v", "1M", "-crf", "30",
            "-vf", "scale='min(1280,iw)':-2",
            "-c:a", "libvorbis",
            target_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if result.returncode == 0 and os.path.exists(target_path):
            if os.path.exists(temp_path):
                os.remove(temp_path)
            size_kb = int(os.path.getsize(target_path) / 1024)
            return target_filename, size_kb
    except Exception as e:
        print(f"FFmpeg conversion skipped/failed ({e}), saving original format.")

    # Fallback: keep original format if conversion failed or timed out
    ext = os.path.splitext(original_filename)[1].lower() or ".mp4"
    fallback_filename = f"{base_name}_{unique_id}{ext}"
    fallback_path = os.path.join(dest_folder, fallback_filename)
    os.rename(temp_path, fallback_path)
    size_kb = int(os.path.getsize(fallback_path) / 1024)
    return fallback_filename, size_kb

@router.post("/upload")
async def upload_media_file(
    file: UploadFile = File(...),
    folder: str = Form("galeria"),
    is_favicon: bool = Form(False),
    admin: User = Depends(require_admin)
):
    """Uploads an image or video, optimizes it (WebP / WebM / ICO) and stores it in the designated folder."""
    clean_folder = folder.lower().strip()
    if clean_folder not in VALID_FOLDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Carpeta no válida. Opciones permitidas: {', '.join(VALID_FOLDERS)}"
        )

    content_type = file.content_type or ""
    original_filename = file.filename or "archivo"
    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío.")

    is_fav = is_favicon or clean_folder == "favicon" or ("favicon" in original_filename.lower() and clean_folder == "sistema")
    is_video = not is_fav and ("video" in content_type or clean_folder == "videos" or original_filename.lower().endswith((".mp4", ".mov", ".avi", ".webm")))

    try:
        if is_fav:
            filename, size_kb = process_favicon(file_bytes, original_filename)
            media_type = "image"
            clean_folder = "sistema"
        elif is_video:
            filename, size_kb = process_video(file_bytes, original_filename)
            media_type = "video"
            clean_folder = "videos"
        elif original_filename.lower().endswith(".svg"):
            base_name = os.path.splitext(sanitize_filename(original_filename))[0][:30]
            unique_id = uuid.uuid4().hex[:8]
            filename = f"{base_name}_{unique_id}.svg"
            dest_folder = os.path.join(UPLOADS_ROOT, clean_folder)
            os.makedirs(dest_folder, exist_ok=True)
            with open(os.path.join(dest_folder, filename), "wb") as f:
                f.write(file_bytes)
            size_kb = max(1, int(len(file_bytes) / 1024))
            media_type = "image"
        else:
            filename, size_kb = optimize_image(file_bytes, clean_folder, original_filename)
            media_type = "image"

        file_url = f"/uploads/{clean_folder}/{filename}"
        return {
            "success": True,
            "url": file_url,
            "filename": filename,
            "original_name": original_filename,
            "folder": clean_folder,
            "size_kb": size_kb,
            "type": media_type,
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando archivo multimedia: {str(e)}"
        )

@router.get("")
def list_media_files(
    folder: Optional[str] = Query(None, description="Filtrar por carpeta específica"),
    user: User = Depends(require_barber_or_admin)
):
    """Lists all uploaded media files on the server."""
    folders_to_scan = [folder.lower().strip()] if folder and folder.lower().strip() in VALID_FOLDERS else VALID_FOLDERS
    items = []

    for fld in folders_to_scan:
        dir_path = os.path.join(UPLOADS_ROOT, fld)
        if not os.path.exists(dir_path):
            continue

        for fname in os.listdir(dir_path):
            if fname.startswith("."):
                continue
            full_path = os.path.join(dir_path, fname)
            if not os.path.isfile(full_path):
                continue

            stat = os.stat(full_path)
            is_vid = fname.lower().endswith((".webm", ".mp4", ".mov", ".avi"))
            items.append({
                "url": f"/uploads/{fld}/{fname}",
                "filename": fname,
                "folder": fld,
                "size_kb": int(stat.st_size / 1024),
                "type": "video" if is_vid else "image",
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

    # Sort newest first
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items

@router.delete("/{folder}/{filename}")
def delete_media_file(
    folder: str,
    filename: str,
    admin: User = Depends(require_admin)
):
    """Permanently deletes an uploaded media file."""
    clean_folder = folder.lower().strip()
    clean_filename = os.path.basename(filename)

    if clean_folder not in VALID_FOLDERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Carpeta no válida.")

    file_path = os.path.join(UPLOADS_ROOT, clean_folder, clean_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado.")

    try:
        os.remove(file_path)
        return {"success": True, "message": f"Archivo {clean_filename} eliminado correctamente."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
