"""Cloudinary integration for image uploads."""
import asyncio
import cloudinary
import cloudinary.uploader
from typing import Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


async def upload_image(
    image_bytes: bytes,
    folder_path: str,
    public_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload compressed image to Cloudinary.
    
    Args:
        image_bytes: Compressed image bytes
        folder_path: Folder path (e.g., "kosmixspaces/partnerId/listingId")
        public_id: Optional public ID (auto-generated if not provided)
    
    Returns:
        {
            "public_id": str,
            "secure_url": str,
            "width": int,
            "height": int,
            "bytes": int,
            "format": str
        }
    """
    try:
        # Cloudinary upload is synchronous, run in thread pool
        upload_result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            image_bytes,
            folder=folder_path,
            public_id=public_id,
            resource_type="image"
        )
        
        return {
            "public_id": upload_result["public_id"],
            "secure_url": upload_result["secure_url"],
            "width": upload_result["width"],
            "height": upload_result["height"],
            "bytes": upload_result["bytes"],
            "format": upload_result["format"]
        }
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


async def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary."""
    try:
        result = await asyncio.to_thread(cloudinary.uploader.destroy, public_id)
        return result.get("result") == "ok"
    except Exception:
        return False
