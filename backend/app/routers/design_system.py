"""Design system configuration API routes."""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse

from app.models.design_system import (
    DesignSystemConfigUpdate,
    UserPreferencesUpdate,
    UIPreferences,
    DesignSystemAnalytics
)
from app.services.design_system_service import (
    get_design_system_config,
    update_design_system_config,
    get_user_design_preferences,
    update_user_design_preferences,
    get_design_system_for_user,
    track_design_system_analytics,
    get_design_system_metrics,
    get_popular_design_preferences,
    export_design_system_config,
    import_design_system_config,
    reset_design_system_to_defaults
)
from app.core.errors import AppError

router = APIRouter()


@router.get("/config")
async def get_design_config(
    user_id: Optional[str] = None,
    user_type: str = "anonymous"
):
    """Get design system configuration for a user."""
    try:
        config_data = await get_design_system_for_user(user_id, user_type)
        
        return {
            "success": True,
            "data": config_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get design configuration: {str(e)}"
        )


@router.put("/config")
async def update_design_config(
    updates: DesignSystemConfigUpdate,
    updated_by: Optional[str] = None
):
    """Update design system configuration (admin only)."""
    try:
        config = await update_design_system_config(
            updates.model_dump(exclude_unset=True),
            updated_by
        )
        
        return {
            "success": True,
            "data": config.model_dump(),
            "message": "Design system configuration updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update design configuration: {str(e)}"
        )


@router.get("/preferences/{user_id}")
async def get_user_preferences(
    user_id: str,
    user_type: str = "anonymous"
):
    """Get user-specific design preferences."""
    try:
        preferences = await get_user_design_preferences(user_id, user_type)
        
        return {
            "success": True,
            "data": preferences.model_dump() if preferences else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user preferences: {str(e)}"
        )


@router.put("/preferences/{user_id}")
async def update_user_preferences(
    user_id: str,
    updates: UserPreferencesUpdate,
    user_type: str = "anonymous"
):
    """Update user design preferences."""
    try:
        if not updates.preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preferences data is required"
            )
        
        preferences = await update_user_design_preferences(
            user_id,
            user_type,
            updates.preferences,
            updates.device
        )
        
        return {
            "success": True,
            "data": preferences.model_dump(),
            "message": "User preferences updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user preferences: {str(e)}"
        )


@router.post("/analytics")
async def track_analytics(analytics_data: DesignSystemAnalytics):
    """Track design system usage analytics."""
    try:
        await track_design_system_analytics(analytics_data)
        
        return {
            "success": True,
            "message": "Analytics data tracked successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track analytics: {str(e)}"
        )


@router.get("/metrics")
async def get_metrics():
    """Get design system metrics (admin only)."""
    try:
        metrics = await get_design_system_metrics()
        popular_prefs = await get_popular_design_preferences()
        
        return {
            "success": True,
            "data": {
                "metrics": metrics.model_dump(),
                "popularPreferences": popular_prefs
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )


@router.get("/export")
async def export_config():
    """Export complete design system configuration (admin only)."""
    try:
        config_data = await export_design_system_config()
        
        return {
            "success": True,
            "data": config_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export configuration: {str(e)}"
        )


@router.post("/import")
async def import_config(config_data: Dict[str, Any]):
    """Import design system configuration (admin only)."""
    try:
        config = await import_design_system_config(config_data)
        
        return {
            "success": True,
            "data": config.model_dump(),
            "message": "Design system configuration imported successfully"
        }
    except AppError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import configuration: {str(e)}"
        )


@router.post("/reset")
async def reset_config():
    """Reset design system to default configuration (admin only)."""
    try:
        config = await reset_design_system_to_defaults()
        
        return {
            "success": True,
            "data": config.model_dump(),
            "message": "Design system reset to defaults successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset configuration: {str(e)}"
        )


@router.get("/themes")
async def get_available_themes():
    """Get available theme configurations."""
    themes = {
        "light": {
            "name": "Light Theme",
            "description": "Clean and bright interface",
            "preview": {
                "primary": "#2D9A87",
                "background": "#FFFFFF",
                "surface": "#F8FAFC",
                "text": "#1E293B"
            }
        },
        "dark": {
            "name": "Dark Theme", 
            "description": "Easy on the eyes for low-light environments",
            "preview": {
                "primary": "#3DB396",
                "background": "#0F172A",
                "surface": "#1E293B",
                "text": "#F1F5F9"
            }
        },
        "auto": {
            "name": "Auto Theme",
            "description": "Automatically switches based on system preference",
            "preview": {
                "primary": "#2D9A87",
                "background": "auto",
                "surface": "auto", 
                "text": "auto"
            }
        }
    }
    
    return {
        "success": True,
        "data": themes
    }


@router.get("/components")
async def get_component_styles():
    """Get available component style configurations."""
    components = {
        "cards": {
            "flat": {
                "name": "Flat Cards",
                "description": "Minimal cards without shadows",
                "css": "box-shadow: none; border: 1px solid var(--border);"
            },
            "elevated": {
                "name": "Elevated Cards",
                "description": "Cards with subtle shadows for depth",
                "css": "box-shadow: var(--shadow-md); border: 1px solid var(--border);"
            },
            "outlined": {
                "name": "Outlined Cards",
                "description": "Cards with prominent borders",
                "css": "box-shadow: none; border: 2px solid var(--border);"
            }
        },
        "buttons": {
            "filled": {
                "name": "Filled Buttons",
                "description": "Solid background buttons",
                "css": "background: var(--primary); color: var(--primary-foreground);"
            },
            "outlined": {
                "name": "Outlined Buttons", 
                "description": "Transparent buttons with borders",
                "css": "background: transparent; border: 2px solid var(--primary); color: var(--primary);"
            },
            "text": {
                "name": "Text Buttons",
                "description": "Minimal text-only buttons",
                "css": "background: transparent; border: none; color: var(--primary);"
            }
        },
        "forms": {
            "minimal": {
                "name": "Minimal Forms",
                "description": "Clean forms with minimal styling",
                "css": "border: none; border-bottom: 1px solid var(--border);"
            },
            "outlined": {
                "name": "Outlined Forms",
                "description": "Forms with full borders",
                "css": "border: 1px solid var(--border); border-radius: var(--radius);"
            },
            "filled": {
                "name": "Filled Forms",
                "description": "Forms with background fills",
                "css": "background: var(--muted); border: 1px solid transparent;"
            }
        }
    }
    
    return {
        "success": True,
        "data": components
    }


@router.get("/health")
async def design_system_health():
    """Check design system health and status."""
    try:
        config = await get_design_system_config()
        metrics = await get_design_system_metrics()
        
        health_status = {
            "status": "healthy",
            "version": config.version,
            "lastUpdated": config.updatedAt.isoformat() if config.updatedAt else None,
            "totalUsers": metrics.totalUsers,
            "environment": config.environment,
            "features": config.features,
            "timestamp": config.updatedAt.isoformat() if config.updatedAt else None
        }
        
        return {
            "success": True,
            "data": health_status
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": None
        }