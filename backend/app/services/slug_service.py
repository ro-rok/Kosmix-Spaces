"""Slug generation and management service."""
import re
import hashlib
from typing import Optional
from app.db.mongodb import get_database


def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    # Convert to lowercase
    text = text.lower()
    
    # Replace spaces and special characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Remove leading/trailing hyphens
    text = text.strip('-')
    
    # Replace multiple consecutive hyphens with single hyphen
    text = re.sub(r'-+', '-', text)
    
    return text


def generate_hash_suffix(listing_id: str) -> str:
    """Generate deterministic 6-character hash suffix for collision resolution."""
    # Create SHA-256 hash of listing ID
    hash_object = hashlib.sha256(listing_id.encode())
    hash_hex = hash_object.hexdigest()
    
    # Take first 6 characters and ensure they're alphanumeric
    suffix = hash_hex[:6]
    
    # Convert any non-alphanumeric to numbers based on position
    result = ""
    for i, char in enumerate(suffix):
        if char.isalnum():
            result += char
        else:
            result += str(i % 10)
    
    return result


def generate_slug(partner_name: str, locality: str, listing_name: str) -> dict:
    """Generate slug components for a listing."""
    partner_slug = slugify(partner_name)
    locality_slug = slugify(locality)
    name_slug = slugify(listing_name)
    
    # Construct full slug
    base_slug = f"/listing/{partner_slug}/{locality_slug}/{name_slug}"
    
    return {
        "slug": base_slug,
        "partnerSlug": partner_slug,
        "localitySlug": locality_slug,
        "nameSlug": name_slug,
        "hashSuffix": None
    }


async def resolve_slug_collision(base_slug: str, listing_id: str) -> str:
    """Resolve slug collision by adding hash suffix."""
    db = get_database()
    
    # Check if base slug exists
    existing = await db.premium_listings.find_one({
        "slugData.slug": base_slug,
        "_id": {"$ne": listing_id}  # Exclude current listing
    })
    
    if not existing:
        return base_slug
    
    # Generate hash suffix and create collision-resolved slug
    hash_suffix = generate_hash_suffix(str(listing_id))
    collision_slug = f"{base_slug}-{hash_suffix}"
    
    # Double-check the collision-resolved slug is unique
    collision_existing = await db.premium_listings.find_one({
        "slugData.slug": collision_slug,
        "_id": {"$ne": listing_id}
    })
    
    if collision_existing:
        # Very rare case - add timestamp
        import time
        timestamp_suffix = str(int(time.time()))[-4:]  # Last 4 digits
        collision_slug = f"{base_slug}-{hash_suffix}-{timestamp_suffix}"
    
    return collision_slug


async def ensure_unique_slug(partner_name: str, locality: str, listing_name: str, listing_id: str) -> dict:
    """Ensure slug is unique, resolving collisions if necessary."""
    slug_data = generate_slug(partner_name, locality, listing_name)
    
    # Check for collision and resolve if needed
    final_slug = await resolve_slug_collision(slug_data["slug"], listing_id)
    
    # Update slug data if collision was resolved
    if final_slug != slug_data["slug"]:
        slug_data["slug"] = final_slug
        slug_data["hashSuffix"] = final_slug.split("-")[-1]  # Extract hash suffix
    
    return slug_data


async def find_listing_by_slug(slug: str) -> Optional[dict]:
    """Find listing by slug (premium listings only)."""
    db = get_database()
    
    # Normalize slug - add /listing/ prefix if not present
    if not slug.startswith('/listing/'):
        slug = f"/listing/{slug}"
    
    # Find premium listing by slug
    listing = await db.premium_listings.find_one({"slugData.slug": slug})
    
    return listing


async def update_listing_slug(listing_id: str, partner_name: str, locality: str, listing_name: str) -> dict:
    """Update listing slug when basic info changes."""
    db = get_database()
    
    # Generate new slug data
    new_slug_data = await ensure_unique_slug(partner_name, locality, listing_name, listing_id)
    
    # Update in database
    await db.premium_listings.update_one(
        {"_id": listing_id},
        {"$set": {"slugData": new_slug_data}}
    )
    
    return new_slug_data


def validate_slug_format(slug: str) -> bool:
    """Validate slug follows expected format."""
    if not slug.startswith('/listing/'):
        return False
    
    parts = slug.split('/')
    if len(parts) < 5:  # ['', 'listing', 'partner', 'locality', 'name']
        return False
    
    # Check each component is valid
    for part in parts[2:]:  # Skip empty string and 'listing'
        if not part or not re.match(r'^[a-z0-9-]+$', part):
            return False
        if part.startswith('-') or part.endswith('-'):
            return False
    
    return True


def extract_slug_components(slug: str) -> Optional[dict]:
    """Extract components from a slug."""
    if not validate_slug_format(slug):
        return None
    
    parts = slug.split('/')
    
    # Handle collision-resolved slugs (with hash suffix)
    name_part = parts[4]
    hash_suffix = None
    
    if '-' in name_part and len(name_part.split('-')[-1]) == 6:
        # Might have hash suffix
        name_parts = name_part.split('-')
        potential_hash = name_parts[-1]
        if re.match(r'^[a-z0-9]{6}$', potential_hash):
            hash_suffix = potential_hash
            name_part = '-'.join(name_parts[:-1])
    
    return {
        "partnerSlug": parts[2],
        "localitySlug": parts[3], 
        "nameSlug": name_part,
        "hashSuffix": hash_suffix
    }