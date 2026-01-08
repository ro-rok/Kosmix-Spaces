"""Server-side image compression using Pillow."""
import io
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image

from app.core.errors import ValidationError

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
MAX_WIDTH = 1600
ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
WEBP_QUALITY = 75
JPEG_QUALITY = 75


async def compress_image(file: UploadFile) -> Tuple[bytes, str, int, int, int]:
    """
    Compress an image before uploading to Cloudinary.
    
    Steps:
    1. Validate content-type
    2. Read bytes (max 10MB)
    3. Open with PIL
    4. Convert to RGB (handle PNG alpha)
    5. Resize to max 1600px width (maintain aspect ratio)
    6. Strip EXIF metadata
    7. Save as WEBP (preferred) or JPEG fallback
    
    Returns:
        (compressed_bytes, format, width, height, byte_size)
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            f"Invalid image type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check size
    if len(content) > MAX_UPLOAD_SIZE:
        raise ValidationError(f"File too large. Maximum size: {MAX_UPLOAD_SIZE / 1024 / 1024}MB")
    
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(content))
        
        # Convert to RGB (handle PNG alpha by compositing on white)
        if image.mode in ("RGBA", "LA", "P"):
            # Create white background
            rgb_image = Image.new("RGB", image.size, (255, 255, 255))
            if image.mode == "P":
                image = image.convert("RGBA")
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ("RGBA", "LA") else None)
            image = rgb_image
        elif image.mode != "RGB":
            image = image.convert("RGB")
        
        # Resize if needed (maintain aspect ratio)
        width, height = image.size
        if width > MAX_WIDTH:
            ratio = MAX_WIDTH / width
            new_height = int(height * ratio)
            image = image.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
            width, height = MAX_WIDTH, new_height
        
        # Strip EXIF metadata
        # Save to bytes without EXIF
        output = io.BytesIO()
        
        # Try WEBP first
        try:
            image.save(
                output,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=6,
                optimize=True
            )
            format_name = "webp"
        except Exception:
            # Fallback to JPEG
            output = io.BytesIO()
            image.save(
                output,
                format="JPEG",
                quality=JPEG_QUALITY,
                optimize=True
            )
            format_name = "jpeg"
        
        compressed_bytes = output.getvalue()
        byte_size = len(compressed_bytes)
        
        return (compressed_bytes, format_name, width, height, byte_size)
    
    except Exception as e:
        raise ValidationError(f"Failed to process image: {str(e)}")
