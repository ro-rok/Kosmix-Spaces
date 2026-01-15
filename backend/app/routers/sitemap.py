"""Sitemap routes for SEO."""
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.core.security import require_admin
from app.services.sitemap_service import (
    get_sitemap,
    regenerate_sitemap,
    get_sitemap_stats,
    invalidate_sitemap_cache
)


router = APIRouter()


@router.get("/sitemap.xml")
async def serve_sitemap():
    """
    Serve the sitemap.xml file for search engines.
    Returns cached version if available, otherwise generates new one.
    """
    xml_content = await get_sitemap(use_cache=True)
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            "X-Robots-Tag": "noindex"  # Don't index the sitemap itself
        }
    )


@router.post("/api/admin/sitemap/regenerate")
async def admin_regenerate_sitemap(current_user: dict = Depends(require_admin)):
    """
    Manually regenerate the sitemap (admin only).
    Invalidates cache and generates fresh sitemap.
    """
    xml_content = await regenerate_sitemap()
    
    return {
        "ok": True,
        "message": "Sitemap regenerated successfully",
        "size": len(xml_content),
        "timestamp": "now"
    }


@router.post("/api/admin/sitemap/invalidate")
async def admin_invalidate_sitemap(current_user: dict = Depends(require_admin)):
    """
    Invalidate sitemap cache (admin only).
    Next request will trigger regeneration.
    """
    invalidate_sitemap_cache()
    
    return {
        "ok": True,
        "message": "Sitemap cache invalidated"
    }


@router.get("/api/admin/sitemap/stats")
async def admin_sitemap_stats(current_user: dict = Depends(require_admin)):
    """
    Get sitemap statistics (admin only).
    """
    stats = await get_sitemap_stats()
    
    return {
        "ok": True,
        "stats": stats
    }



