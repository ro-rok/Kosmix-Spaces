"""SEO metadata generation and management service."""
from typing import Dict, List, Optional
from datetime import datetime
from bson import ObjectId

from app.db.mongodb import get_database
from app.models.premium_listing import SEOMetadata
from app.core.config import get_settings
from app.core.errors import NotFoundError


settings = get_settings()


def generate_listing_seo(listing: dict) -> SEOMetadata:
    """
    Auto-generate SEO metadata from listing data.
    
    Args:
        listing: The listing document from database
        
    Returns:
        SEOMetadata object with auto-generated fields
    """
    # Extract basic info
    display_name = listing.get("displayName", "")
    overview = listing.get("overview", "")
    locality = listing.get("location", {}).get("locality", "")
    city = listing.get("location", {}).get("city", "Delhi")
    amenities = listing.get("amenities", [])
    slug = listing.get("slugData", {}).get("slug", "")
    
    # Get first hero photo for OG/Twitter images
    hero_photos = listing.get("heroPhotos", [])
    og_image = hero_photos[0]["url"] if hero_photos and len(hero_photos) > 0 else None
    
    # Generate meta title (optimal: 50-60 chars, max 70 for better context)
    # Google truncates at ~600px, but 60 chars is safe for most cases
    meta_title = f"{display_name} | Coworking Space in {locality}, {city} | Kosmix Spaces"
    if len(meta_title) > 70:
        # Try shorter version
        meta_title = f"{display_name} | {locality} | Kosmix Spaces"
        if len(meta_title) > 70:
            # Truncate display name if still too long
            max_name_len = 70 - len(f" | {locality} | Kosmix Spaces")
            if max_name_len > 0:
                meta_title = f"{display_name[:max_name_len]}... | {locality} | Kosmix Spaces"
            else:
                meta_title = f"{display_name[:30]}... | Kosmix Spaces"
    
    # Generate meta description (optimal: 150-160 chars for best display)
    # Use overview text, truncate intelligently at word boundaries when possible
    if overview:
        # Try to truncate at word boundary
        if len(overview) > 160:
            truncated = overview[:157]
            # Find last space before 157 chars
            last_space = truncated.rfind(' ')
            if last_space > 140:  # Only use if we have enough content
                meta_description = overview[:last_space] + "..."
            else:
                meta_description = overview[:157] + "..."
        else:
            meta_description = overview
    else:
        meta_description = f"Verified coworking space in {locality}, {city}. "
        if amenities:
            meta_description += f"Amenities: {', '.join(amenities[:3])}."
    
    # Ensure description is optimal length (150-160 chars)
    if len(meta_description) > 160:
        truncated = meta_description[:157]
        last_space = truncated.rfind(' ')
        if last_space > 140:
            meta_description = meta_description[:last_space] + "..."
        else:
            meta_description = meta_description[:157] + "..."
    elif len(meta_description) < 120 and overview:
        # If too short, try to add more context
        if len(overview) > len(meta_description):
            remaining = 160 - len(meta_description)
            if remaining > 10:
                additional = overview[len(meta_description):len(meta_description) + remaining - 3]
                meta_description = meta_description + " " + additional + "..."
    
    # Generate keywords
    keywords = [
        f"coworking space {locality}",
        f"office space {city}",
        display_name.lower(),
        locality.lower(),
        city.lower(),
        "coworking",
        "workspace",
        "office space"
    ]
    
    # Add amenities as keywords
    keywords.extend([amenity.lower() for amenity in amenities[:5]])
    
    # Add offering types that are enabled
    offerings = listing.get("offerings", {})
    for offering_type, offering_data in offerings.items():
        if offering_data.get("enabled"):
            offering_name = offering_type.replace("-", " ")
            keywords.append(offering_name)
    
    # Remove duplicates and limit to 15 keywords
    keywords = list(dict.fromkeys(keywords))[:15]
    
    # Generate canonical URL (ensure absolute and properly formatted)
    # Ensure slug starts with / if it doesn't already
    slug_clean = slug if slug.startswith('/') else f'/{slug}'
    canonical_url = f"{settings.SITE_URL}/spaces{slug_clean}"
    
    # OG Title (slightly different, can be longer)
    og_title = f"{display_name} - Coworking Space in {locality}, {city}"
    
    # OG Description (can be slightly longer than meta)
    og_description = overview[:200] if overview else meta_description
    
    # Twitter uses same as OG
    twitter_title = og_title
    twitter_description = og_description
    twitter_image = og_image
    
    return SEOMetadata(
        metaTitle=meta_title,
        metaDescription=meta_description,
        keywords=keywords,
        ogTitle=og_title,
        ogDescription=og_description,
        ogImage=og_image,
        twitterCard="summary_large_image",
        twitterTitle=twitter_title,
        twitterDescription=twitter_description,
        twitterImage=twitter_image,
        canonicalUrl=canonical_url,
        autoGenerated=True,
        lastUpdated=datetime.utcnow()
    )


async def update_listing_seo(listing_id: str, seo_data: Optional[Dict] = None) -> SEOMetadata:
    """
    Update or regenerate SEO metadata for a listing.
    
    Args:
        listing_id: The listing ID
        seo_data: Optional custom SEO data. If None, auto-generates from listing.
        
    Returns:
        Updated SEOMetadata object
        
    Raises:
        NotFoundError: If listing not found
    """
    db = get_database()
    
    # Get the listing
    listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise NotFoundError(f"Listing {listing_id} not found")
    
    # Generate or use provided SEO data
    if seo_data:
        # Custom SEO data provided
        seo_metadata = SEOMetadata(**seo_data)
        seo_metadata.autoGenerated = False
        seo_metadata.lastUpdated = datetime.utcnow()
    else:
        # Auto-generate from listing
        seo_metadata = generate_listing_seo(listing)
    
    # Update in database
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                "seoMetadata": seo_metadata.model_dump(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    return seo_metadata


async def get_listing_seo(listing_id: str) -> Optional[SEOMetadata]:
    """
    Get SEO metadata for a listing.
    
    Args:
        listing_id: The listing ID
        
    Returns:
        SEOMetadata object or None if not found
    """
    db = get_database()
    
    listing = await db.premium_listings.find_one(
        {"_id": ObjectId(listing_id)},
        {"seoMetadata": 1}
    )
    
    if not listing or "seoMetadata" not in listing:
        return None
    
    return SEOMetadata(**listing["seoMetadata"])


async def ensure_listing_has_seo(listing_id: str) -> SEOMetadata:
    """
    Ensure a listing has SEO metadata. Generate if missing.
    
    Args:
        listing_id: The listing ID
        
    Returns:
        SEOMetadata object (existing or newly generated)
    """
    # Check if SEO exists
    seo = await get_listing_seo(listing_id)
    
    if seo:
        return seo
    
    # Generate and save SEO
    return await update_listing_seo(listing_id)


async def regenerate_all_listing_seo() -> int:
    """
    Regenerate SEO for all published listings.
    Useful for bulk updates or migrations.
    
    Returns:
        Number of listings updated
    """
    db = get_database()
    
    # Find all published listings
    listings = await db.premium_listings.find({
        "isPublished": True,
        "verificationStatus": {"$in": ["APPROVED", "APPROVED_VERIFIED"]}
    }).to_list(length=None)
    
    count = 0
    for listing in listings:
        try:
            await update_listing_seo(str(listing["_id"]))
            count += 1
        except Exception as e:
            print(f"Error updating SEO for listing {listing['_id']}: {e}")
    
    return count



