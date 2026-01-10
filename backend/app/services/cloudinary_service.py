"""Cloudinary image upload and management service."""
import cloudinary
import cloudinary.uploader
from typing import List, Optional, Dict, Any
from fastapi import UploadFile
from app.core.config import get_settings

settings = get_settings()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


async def upload_image(
    file: UploadFile,
    folder: str = "listings",
    tags: Optional[List[str]] = None,
    transformation: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Upload image to Cloudinary."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Prepare upload options
        upload_options = {
            "folder": folder,
            "resource_type": "image",
            "format": "auto",  # Auto-optimize format
            "quality": "auto:good",  # Auto-optimize quality
        }
        
        if tags:
            upload_options["tags"] = tags
        
        if transformation:
            upload_options["transformation"] = transformation
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file_content, **upload_options)
        
        return {
            "url": result["secure_url"],
            "publicId": result["public_id"],
            "width": result["width"],
            "height": result["height"],
            "bytes": result["bytes"],
            "format": result["format"]
        }
        
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


async def delete_image(public_id: str) -> bool:
    """Delete image from Cloudinary."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Cloudinary delete failed: {e}")
        return False


async def upload_multiple_images(
    files: List[UploadFile],
    folder: str = "listings",
    tags: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """Upload multiple images to Cloudinary."""
    results = []
    
    for file in files:
        try:
            result = await upload_image(file, folder, tags)
            results.append(result)
        except Exception as e:
            # Log error but continue with other files
            print(f"Failed to upload {file.filename}: {e}")
            continue
    
    return results


def generate_thumbnail_url(public_id: str, width: int = 300, height: int = 200) -> str:
    """Generate thumbnail URL for an image."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto:good",
        format="auto"
    )


def generate_responsive_urls(public_id: str) -> Dict[str, str]:
    """Generate responsive image URLs for different screen sizes."""
    base_image = cloudinary.CloudinaryImage(public_id)
    
    return {
        "thumbnail": base_image.build_url(width=300, height=200, crop="fill", quality="auto:good"),
        "small": base_image.build_url(width=600, height=400, crop="fill", quality="auto:good"),
        "medium": base_image.build_url(width=900, height=600, crop="fill", quality="auto:good"),
        "large": base_image.build_url(width=1200, height=800, crop="fill", quality="auto:good"),
        "original": base_image.build_url(quality="auto:good")
    }


async def get_image_info(public_id: str) -> Optional[Dict[str, Any]]:
    """Get image information from Cloudinary."""
    try:
        result = cloudinary.api.resource(public_id)
        return {
            "publicId": result["public_id"],
            "url": result["secure_url"],
            "width": result["width"],
            "height": result["height"],
            "bytes": result["bytes"],
            "format": result["format"],
            "createdAt": result["created_at"]
        }
    except Exception as e:
        print(f"Failed to get image info: {e}")
        return None


async def bulk_delete_images(public_ids: List[str]) -> Dict[str, Any]:
    """Delete multiple images from Cloudinary."""
    try:
        result = cloudinary.api.delete_resources(public_ids)
        return {
            "deleted": result.get("deleted", {}),
            "deleted_counts": result.get("deleted_counts", {}),
            "partial": result.get("partial", False)
        }
    except Exception as e:
        print(f"Bulk delete failed: {e}")
        return {"error": str(e)}


def validate_image_file(file: UploadFile) -> tuple[bool, Optional[str]]:
    """Validate uploaded image file."""
    # Check content type
    if not file.content_type or not file.content_type.startswith('image/'):
        return False, "File must be an image"
    
    # Check file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        return False, "File size must be less than 10MB"
    
    # Check allowed formats
    allowed_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if file.content_type not in allowed_formats:
        return False, f"Allowed formats: {', '.join(allowed_formats)}"
    
    return True, None