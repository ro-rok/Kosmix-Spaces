"""Cloudinary image upload and management service with advanced compression."""
import cloudinary
import cloudinary.uploader
from typing import List, Optional, Dict, Any, Tuple
from fastapi import UploadFile
from PIL import Image, ImageOps
import io
from app.core.config import get_settings

settings = get_settings()

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


class CompressionSettings:
    """Image compression settings for different use cases."""
    
    # Workspace listing photos - high quality for hero images
    WORKSPACE_HERO = {
        "quality": "90",
        "width": 1920,
        "height": 1080,
        "crop": "limit"
    }
    
    # Offering-specific photos - balanced quality and size
    OFFERING_PHOTOS = {
        "quality": "80", 
        "width": 1200,
        "height": 800,
        "crop": "limit"
    }
    
    # Thumbnail generation
    THUMBNAILS = {
        "quality": "75",
        "width": 400,
        "height": 300,
        "crop": "fill"
    }
    
    # Mobile optimized
    MOBILE_OPTIMIZED = {
        "quality": "70",
        "width": 800,
        "height": 600,
        "crop": "limit"
    }


def get_compression_settings(photo_type: str = "offering") -> Dict[str, Any]:
    """Get optimal compression settings based on photo type."""
    settings_map = {
        "hero": CompressionSettings.WORKSPACE_HERO,
        "offering": CompressionSettings.OFFERING_PHOTOS,
        "thumbnail": CompressionSettings.THUMBNAILS,
        "mobile": CompressionSettings.MOBILE_OPTIMIZED
    }
    return settings_map.get(photo_type, CompressionSettings.OFFERING_PHOTOS)


async def preprocess_image(file: UploadFile, max_size_kb: int = 500) -> Tuple[bytes, Dict[str, Any]]:
    """Preprocess image before uploading to Cloudinary."""
    try:
        # Read original file
        original_content = await file.read()
        original_size = len(original_content)
        
        # Reset file pointer for potential re-reading
        await file.seek(0)
        
        # If file is already small enough, return as-is
        if original_size <= max_size_kb * 1024:
            return original_content, {
                "preprocessed": False,
                "original_size": original_size,
                "final_size": original_size,
                "compression_ratio": 0
            }
        
        # Open image with PIL for preprocessing
        image = Image.open(io.BytesIO(original_content))
        
        # Auto-orient based on EXIF data
        image = ImageOps.exif_transpose(image)
        
        # Convert to RGB if necessary (for JPEG output)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparent images
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Calculate optimal dimensions (max 1920x1080 for workspace photos)
        max_width, max_height = 1920, 1080
        width, height = image.size
        
        if width > max_width or height > max_height:
            # Calculate scaling factor to maintain aspect ratio
            scale_factor = min(max_width / width, max_height / height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Try different quality levels to meet size target
        for quality in [85, 75, 65, 55, 45]:
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            compressed_content = output.getvalue()
            
            if len(compressed_content) <= max_size_kb * 1024:
                compression_ratio = round((1 - len(compressed_content) / original_size) * 100)
                return compressed_content, {
                    "preprocessed": True,
                    "original_size": original_size,
                    "final_size": len(compressed_content),
                    "compression_ratio": compression_ratio,
                    "quality_used": quality,
                    "dimensions": f"{image.size[0]}x{image.size[1]}"
                }
        
        # If we can't meet the target, use the lowest quality
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=45, optimize=True)
        compressed_content = output.getvalue()
        compression_ratio = round((1 - len(compressed_content) / original_size) * 100)
        
        return compressed_content, {
            "preprocessed": True,
            "original_size": original_size,
            "final_size": len(compressed_content),
            "compression_ratio": compression_ratio,
            "quality_used": 45,
            "dimensions": f"{image.size[0]}x{image.size[1]}",
            "note": "Could not meet target size, used minimum quality"
        }
        
    except Exception as e:
        # If preprocessing fails, return original
        print(f"Image preprocessing failed: {e}")
        return original_content, {
            "preprocessed": False,
            "original_size": original_size,
            "final_size": original_size,
            "compression_ratio": 0,
            "error": str(e)
        }
async def upload_image(
    file: UploadFile,
    folder: str = "listings",
    tags: Optional[List[str]] = None,
    photo_type: str = "offering",
    enable_compression: bool = True,
    max_size_kb: int = 500
) -> Dict[str, Any]:
    """Upload image to Cloudinary with advanced compression."""
    try:
        # Preprocess image if compression is enabled
        if enable_compression:
            file_content, compression_info = await preprocess_image(file, max_size_kb)
        else:
            file_content = await file.read()
            compression_info = {"preprocessed": False}
        
        # Get optimal compression settings for this photo type
        compression_settings = get_compression_settings(photo_type)
        
        # Prepare upload options
        upload_options = {
            "folder": f"{settings.CLOUDINARY_FOLDER}/{folder}",
            "resource_type": "image",
            "quality": compression_settings["quality"],
            "transformation": [compression_settings] if photo_type != "original" else None,
            "eager": [
                # Generate multiple optimized versions
                {"width": 400, "height": 300, "crop": "fill", "quality": "75"},  # Thumbnail
                {"width": 800, "height": 600, "crop": "limit", "quality": "80"},  # Mobile
                {"width": 1200, "height": 800, "crop": "limit", "quality": "85"}  # Desktop
            ],
            "eager_async": True  # Generate variants asynchronously
        }
        
        if tags:
            upload_options["tags"] = tags
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file_content, **upload_options)
        
        # Calculate total compression (preprocessing + Cloudinary)
        cloudinary_size = result.get("bytes", len(file_content))
        original_size = compression_info.get("original_size", len(file_content))
        total_compression = round((1 - cloudinary_size / original_size) * 100) if original_size > 0 else 0
        
        return {
            "url": result["secure_url"],
            "publicId": result["public_id"],
            "width": result["width"],
            "height": result["height"],
            "bytes": result["bytes"],
            "format": result["format"],
            "compression": {
                **compression_info,
                "cloudinary_size": cloudinary_size,
                "total_compression_ratio": total_compression,
                "photo_type": photo_type
            },
            "variants": {
                "thumbnail": f"{result['secure_url'].replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto:good,f_auto/')}",
                "mobile": f"{result['secure_url'].replace('/upload/', '/upload/w_800,h_600,c_limit,q_auto:good,f_auto/')}",
                "desktop": f"{result['secure_url'].replace('/upload/', '/upload/w_1200,h_800,c_limit,q_auto:good,f_auto/')}"
            }
        }
        
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


async def upload_offering_photo(
    file: UploadFile,
    listing_id: str,
    offering_type: str,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Upload photo specifically for an offering type with optimized compression."""
    # Add offering-specific tags
    photo_tags = [f"listing:{listing_id}", f"offering:{offering_type}"]
    if tags:
        photo_tags.extend(tags)
    
    # Use offering-specific folder structure
    folder = f"listings/{listing_id}/offerings/{offering_type}"
    
    return await upload_image(
        file=file,
        folder=folder,
        tags=photo_tags,
        photo_type="offering",
        enable_compression=True,
        max_size_kb=400  # Smaller size for offering photos
    )


async def upload_hero_photo(
    file: UploadFile,
    listing_id: str,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Upload hero photo with highest quality settings."""
    # Add hero-specific tags
    photo_tags = [f"listing:{listing_id}", "hero"]
    if tags:
        photo_tags.extend(tags)
    
    folder = f"listings/{listing_id}/hero"
    
    return await upload_image(
        file=file,
        folder=folder,
        tags=photo_tags,
        photo_type="hero",
        enable_compression=True,
        max_size_kb=800  # Larger size allowed for hero photos
    )


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
    tags: Optional[List[str]] = None,
    photo_type: str = "offering",
    enable_compression: bool = True
) -> List[Dict[str, Any]]:
    """Upload multiple images to Cloudinary with compression."""
    results = []
    
    for file in files:
        try:
            result = await upload_image(
                file=file, 
                folder=folder, 
                tags=tags,
                photo_type=photo_type,
                enable_compression=enable_compression
            )
            results.append(result)
        except Exception as e:
            # Log error but continue with other files
            print(f"Failed to upload {file.filename}: {e}")
            results.append({
                "error": str(e),
                "filename": file.filename,
                "success": False
            })
            continue
    
    return results


def generate_optimized_url(
    public_id: str, 
    width: int = None, 
    height: int = None,
    quality: str = "auto:good",
    format: str = "auto",
    crop: str = "limit"
) -> str:
    """Generate optimized URL with specific parameters."""
    transformation = {
        "quality": quality,
        "format": format,
        "crop": crop
    }
    
    if width:
        transformation["width"] = width
    if height:
        transformation["height"] = height
    
    return cloudinary.CloudinaryImage(public_id).build_url(**transformation)


def generate_thumbnail_url(public_id: str, width: int = 300, height: int = 200) -> str:
    """Generate thumbnail URL for an image."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto:good",
        format="auto"
    )


def generate_responsive_urls(public_id: str, photo_type: str = "offering") -> Dict[str, str]:
    """Generate responsive image URLs for different screen sizes with optimal compression."""
    base_image = cloudinary.CloudinaryImage(public_id)
    
    # Different quality settings based on photo type
    quality = "auto:best" if photo_type == "hero" else "auto:good"
    
    return {
        "thumbnail": base_image.build_url(
            width=300, height=200, crop="fill", 
            quality="auto:eco", format="auto"
        ),
        "small": base_image.build_url(
            width=600, height=400, crop="limit", 
            quality=quality, format="auto"
        ),
        "medium": base_image.build_url(
            width=900, height=600, crop="limit", 
            quality=quality, format="auto"
        ),
        "large": base_image.build_url(
            width=1200, height=800, crop="limit", 
            quality=quality, format="auto"
        ),
        "xlarge": base_image.build_url(
            width=1920, height=1080, crop="limit", 
            quality=quality, format="auto"
        ),
        "original": base_image.build_url(quality=quality, format="auto")
    }


async def get_compression_stats(public_ids: List[str]) -> Dict[str, Any]:
    """Get compression statistics for multiple images."""
    try:
        stats = {
            "total_images": len(public_ids),
            "total_original_size": 0,
            "total_compressed_size": 0,
            "average_compression_ratio": 0,
            "images": []
        }
        
        for public_id in public_ids:
            try:
                resource = cloudinary.api.resource(public_id)
                image_stats = {
                    "public_id": public_id,
                    "size": resource.get("bytes", 0),
                    "format": resource.get("format", "unknown"),
                    "dimensions": f"{resource.get('width', 0)}x{resource.get('height', 0)}"
                }
                stats["images"].append(image_stats)
                stats["total_compressed_size"] += resource.get("bytes", 0)
            except Exception as e:
                print(f"Failed to get stats for {public_id}: {e}")
        
        # Calculate average compression if we have the data
        if stats["total_original_size"] > 0:
            stats["average_compression_ratio"] = round(
                (1 - stats["total_compressed_size"] / stats["total_original_size"]) * 100
            )
        
        return stats
        
    except Exception as e:
        return {"error": str(e)}


def validate_image_file(file: UploadFile) -> tuple[bool, Optional[str]]:
    """Validate uploaded image file with enhanced checks."""
    try:
        # Check if file exists
        if not file:
            return False, "No file provided"
        
        # Check filename
        if not file.filename:
            return False, "Filename is required"
        
        # Check content type
        if not file.content_type:
            return False, "File content type is missing"
            
        if not file.content_type.startswith('image/'):
            return False, "File must be an image"
        
        # Check file size (max 15MB for raw uploads, will be compressed)
        if file.size and file.size > 15 * 1024 * 1024:
            return False, "File size must be less than 15MB"
        
        # Check allowed formats
        allowed_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
        if file.content_type not in allowed_formats:
            return False, f"Allowed formats: JPEG, PNG, WebP, HEIC. Got: {file.content_type}"
        
        # Check for potentially malicious filenames
        dangerous_extensions = ['.exe', '.bat', '.cmd', '.scr', '.pif']
        if any(file.filename.lower().endswith(ext) for ext in dangerous_extensions):
            return False, "Invalid file type detected"
        
        return True, None
        
    except Exception as e:
        return False, f"File validation error: {str(e)}"
    
    return True, None


async def optimize_existing_image(public_id: str, photo_type: str = "offering") -> Dict[str, Any]:
    """Re-optimize an existing image with new compression settings."""
    try:
        # Get current image info
        current_info = await get_image_info(public_id)
        if not current_info:
            return {"error": "Image not found"}
        
        # Get optimal settings for this photo type
        settings = get_compression_settings(photo_type)
        
        # Create optimized version
        result = cloudinary.uploader.explicit(
            public_id,
            type="upload",
            eager=[settings],
            eager_async=False
        )
        
        return {
            "success": True,
            "public_id": public_id,
            "original_size": current_info.get("bytes", 0),
            "optimized_urls": result.get("eager", []),
            "photo_type": photo_type
        }
        
    except Exception as e:
        return {"error": str(e)}


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



async def upload_temporary_photo(
    file: UploadFile,
    partner_id: str,
    offering_type: Optional[str] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Upload photo to temporary folder for listing builder without requiring listing ID."""
    # Add temporary-specific tags
    photo_tags = [f"partner:{partner_id}", "temporary", "listing-builder"]
    if offering_type:
        photo_tags.append(f"offering:{offering_type}")
    if tags:
        photo_tags.extend(tags)
    
    # Use temporary folder structure
    folder = f"temp/{partner_id}"
    if offering_type:
        folder += f"/{offering_type}"
    
    return await upload_image(
        file=file,
        folder=folder,
        tags=photo_tags,
        photo_type="offering",  # Use offering compression settings
        enable_compression=True,
        max_size_kb=400
    )


async def move_temporary_photos_to_listing(
    partner_id: str,
    listing_id: str,
    temp_public_ids: List[str],
    offering_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Move temporary photos to permanent listing folder."""
    results = []
    
    for public_id in temp_public_ids:
        try:
            # Get the current image info
            resource = cloudinary.api.resource(public_id)
            
            # Create new public_id for permanent location
            new_folder = f"listings/{listing_id}"
            if offering_type:
                new_folder += f"/{offering_type}"
            
            # Generate new public_id
            original_filename = resource.get('original_filename', 'photo')
            new_public_id = f"{new_folder}/{original_filename}_{len(results)}"
            
            # Copy to new location with updated tags
            new_tags = [f"listing:{listing_id}"]
            if offering_type:
                new_tags.append(f"offering:{offering_type}")
            
            # Use Cloudinary's rename/copy functionality
            result = cloudinary.uploader.rename(
                public_id,
                new_public_id,
                overwrite=True,
                tags=new_tags
            )
            
            results.append({
                "url": result["secure_url"],
                "publicId": result["public_id"],
                "width": result["width"],
                "height": result["height"],
                "bytes": result["bytes"],
                "format": result["format"]
            })
            
        except Exception as e:
            print(f"Failed to move photo {public_id}: {e}")
            continue
    
    return results


async def cleanup_temporary_photos(partner_id: str, max_age_hours: int = 24) -> bool:
    """Clean up temporary photos older than specified hours."""
    try:
        # Search for temporary photos for this partner
        search_query = f"folder:temp/{partner_id}/* AND tags:temporary"
        
        # Get resources older than max_age_hours
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        resources = cloudinary.api.resources(
            type="upload",
            prefix=f"temp/{partner_id}/",
            max_results=500
        )
        
        old_public_ids = []
        for resource in resources.get("resources", []):
            created_at = datetime.fromisoformat(resource["created_at"].replace('Z', '+00:00'))
            if created_at < cutoff_time:
                old_public_ids.append(resource["public_id"])
        
        # Delete old temporary photos
        if old_public_ids:
            cloudinary.api.delete_resources(old_public_ids)
            print(f"Cleaned up {len(old_public_ids)} temporary photos for partner {partner_id}")
        
        return True
        
    except Exception as e:
        print(f"Failed to cleanup temporary photos: {e}")
        return False