"""Sitemap generation and caching service."""
from typing import List, Dict, Optional
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

from app.db.mongodb import get_database
from app.core.config import get_settings


settings = get_settings()


# In-memory cache for sitemap
_sitemap_cache: Optional[Dict[str, any]] = None


def _prettify_xml(elem: Element) -> str:
    """
    Return a pretty-printed XML string for the Element.
    
    Args:
        elem: The root XML element
        
    Returns:
        Formatted XML string
    """
    rough_string = tostring(elem, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")


async def generate_sitemap_xml() -> str:
    """
    Generate complete sitemap XML from database.
    Includes all published listings and static pages.
    
    Returns:
        XML string for sitemap
    """
    db = get_database()
    
    # Create root element
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    # Static pages with priority and change frequency
    static_pages = [
        {
            'loc': f"{settings.SITE_URL}/",
            'priority': '1.0',
            'changefreq': 'daily',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        },
        {
            'loc': f"{settings.SITE_URL}/explore",
            'priority': '0.9',
            'changefreq': 'daily',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        },
        {
            'loc': f"{settings.SITE_URL}/how-it-works",
            'priority': '0.8',
            'changefreq': 'weekly',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        },
        {
            'loc': f"{settings.SITE_URL}/trust",
            'priority': '0.7',
            'changefreq': 'weekly',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        },
        {
            'loc': f"{settings.SITE_URL}/partners",
            'priority': '0.7',
            'changefreq': 'weekly',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        },
        {
            'loc': f"{settings.SITE_URL}/contact",
            'priority': '0.6',
            'changefreq': 'monthly',
            'lastmod': datetime.utcnow().strftime('%Y-%m-%d')
        }
    ]
    
    # Add static pages to sitemap
    for page in static_pages:
        url = SubElement(urlset, 'url')
        
        loc = SubElement(url, 'loc')
        loc.text = page['loc']
        
        lastmod = SubElement(url, 'lastmod')
        lastmod.text = page['lastmod']
        
        changefreq = SubElement(url, 'changefreq')
        changefreq.text = page['changefreq']
        
        priority = SubElement(url, 'priority')
        priority.text = page['priority']
    
    # Get all published and approved listings
    listings = await db.premium_listings.find({
        'isPublished': True,
        'verificationStatus': {'$in': ['APPROVED', 'APPROVED_VERIFIED']}
    }).to_list(length=None)
    
    # Add listings to sitemap
    for listing in listings:
        slug = listing.get('slugData', {}).get('slug', '')
        if not slug:
            continue
        
        url = SubElement(urlset, 'url')
        
        # Location - ensure proper URL format
        loc = SubElement(url, 'loc')
        # Ensure slug doesn't have leading slash, add it if needed
        slug_clean = slug if slug.startswith('/') else f'/{slug}'
        listing_url = f"{settings.SITE_URL}/spaces{slug_clean}"
        loc.text = listing_url
        
        # Last modified date
        lastmod = SubElement(url, 'lastmod')
        updated_at = listing.get('updatedAt', listing.get('createdAt', datetime.utcnow()))
        if isinstance(updated_at, datetime):
            lastmod.text = updated_at.strftime('%Y-%m-%d')
        else:
            lastmod.text = datetime.utcnow().strftime('%Y-%m-%d')
        
        # Change frequency - listings change occasionally
        changefreq = SubElement(url, 'changefreq')
        changefreq.text = 'weekly'
        
        # Priority - listings are important but not as much as main pages
        priority = SubElement(url, 'priority')
        priority.text = '0.8'
    
    # Convert to pretty XML string
    xml_string = _prettify_xml(urlset)
    
    return xml_string


async def get_sitemap(use_cache: bool = True) -> str:
    """
    Get sitemap XML, using cache if available and valid.
    
    Args:
        use_cache: Whether to use cached sitemap if available
        
    Returns:
        XML string for sitemap
    """
    global _sitemap_cache
    
    # Check cache
    if use_cache and _sitemap_cache is not None:
        cache_time = _sitemap_cache.get('timestamp')
        cache_ttl = settings.SITEMAP_CACHE_TTL
        
        if cache_time and (datetime.utcnow() - cache_time).total_seconds() < cache_ttl:
            # Cache is valid
            return _sitemap_cache.get('xml', '')
    
    # Generate new sitemap
    xml = await generate_sitemap_xml()
    
    # Update cache
    _sitemap_cache = {
        'xml': xml,
        'timestamp': datetime.utcnow()
    }
    
    return xml


def invalidate_sitemap_cache() -> None:
    """
    Invalidate the sitemap cache, forcing regeneration on next request.
    Call this when listings are created, updated, or published.
    """
    global _sitemap_cache
    _sitemap_cache = None


async def regenerate_sitemap() -> str:
    """
    Force regeneration of sitemap, bypassing cache.
    
    Returns:
        Newly generated XML string
    """
    invalidate_sitemap_cache()
    return await get_sitemap(use_cache=False)


async def get_sitemap_stats() -> Dict[str, any]:
    """
    Get statistics about the sitemap.
    
    Returns:
        Dictionary with sitemap statistics
    """
    db = get_database()
    
    # Count published listings
    listing_count = await db.premium_listings.count_documents({
        'isPublished': True,
        'verificationStatus': {'$in': ['APPROVED', 'APPROVED_VERIFIED']}
    })
    
    # Static pages count
    static_count = 6  # /, /explore, /how-it-works, /trust, /partners, /contact
    
    # Cache status
    cache_valid = False
    cache_age = None
    
    if _sitemap_cache is not None:
        cache_time = _sitemap_cache.get('timestamp')
        if cache_time:
            cache_age = (datetime.utcnow() - cache_time).total_seconds()
            cache_valid = cache_age < settings.SITEMAP_CACHE_TTL
    
    return {
        'totalUrls': listing_count + static_count,
        'listingUrls': listing_count,
        'staticUrls': static_count,
        'cacheValid': cache_valid,
        'cacheAge': cache_age,
        'cacheTTL': settings.SITEMAP_CACHE_TTL,
        'lastGenerated': _sitemap_cache.get('timestamp') if _sitemap_cache else None
    }



