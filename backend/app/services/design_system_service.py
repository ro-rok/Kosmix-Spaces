"""Design system configuration and management service."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.db.mongodb import get_database
from app.models.design_system import (
    DesignSystemConfig,
    UserDesignPreferences,
    DesignSystemMetrics,
    DesignTokens,
    UIPreferences,
    ComponentConfiguration,
    DesignSystemAnalytics
)
from app.core.errors import NotFoundError, ValidationError


async def get_design_system_config() -> DesignSystemConfig:
    """Get the current design system configuration."""
    db = get_database()
    
    config_doc = await db.design_system_config.find_one({"environment": "production"})
    
    if not config_doc:
        # Create default configuration
        config = DesignSystemConfig()
        config_dict = config.model_dump(by_alias=True)
        await db.design_system_config.insert_one(config_dict)
        return config
    
    return DesignSystemConfig(**config_doc)


async def update_design_system_config(
    updates: Dict[str, Any], 
    updated_by: Optional[str] = None
) -> DesignSystemConfig:
    """Update design system configuration."""
    db = get_database()
    
    # Prepare update document
    update_doc = {
        "updatedAt": datetime.utcnow(),
        "updatedBy": updated_by
    }
    
    # Handle nested updates
    if "tokens" in updates:
        for key, value in updates["tokens"].items():
            update_doc[f"tokens.{key}"] = value
    
    if "preferences" in updates:
        for key, value in updates["preferences"].items():
            update_doc[f"preferences.{key}"] = value
    
    if "components" in updates:
        for key, value in updates["components"].items():
            update_doc[f"components.{key}"] = value
    
    # Handle direct field updates
    direct_fields = ["name", "description", "customCSS", "features"]
    for field in direct_fields:
        if field in updates:
            update_doc[field] = updates[field]
    
    # Update configuration
    result = await db.design_system_config.update_one(
        {"environment": "production"},
        {"$set": update_doc},
        upsert=True
    )
    
    return await get_design_system_config()


async def get_user_design_preferences(
    user_id: str, 
    user_type: str = "anonymous"
) -> Optional[UserDesignPreferences]:
    """Get user-specific design preferences."""
    db = get_database()
    
    prefs_doc = await db.user_design_preferences.find_one({
        "userId": user_id,
        "userType": user_type
    })
    
    if not prefs_doc:
        return None
    
    return UserDesignPreferences(**prefs_doc)


async def update_user_design_preferences(
    user_id: str,
    user_type: str,
    preferences: UIPreferences,
    device: Optional[str] = None
) -> UserDesignPreferences:
    """Update user design preferences."""
    db = get_database()
    
    # Prepare update document
    update_doc = {
        "preferences": preferences.model_dump(),
        "updatedAt": datetime.utcnow()
    }
    
    # Handle device-specific preferences
    if device:
        update_doc[f"devicePreferences.{device}"] = preferences.model_dump()
        update_doc["lastDevice"] = device
    
    # Upsert user preferences
    await db.user_design_preferences.update_one(
        {"userId": user_id, "userType": user_type},
        {
            "$set": update_doc,
            "$setOnInsert": {
                "userId": user_id,
                "userType": user_type,
                "createdAt": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return await get_user_design_preferences(user_id, user_type)


async def get_design_system_for_user(
    user_id: Optional[str] = None,
    user_type: str = "anonymous"
) -> Dict[str, Any]:
    """Get complete design system configuration for a user."""
    # Get base configuration
    config = await get_design_system_config()
    
    # Get user preferences if user is identified
    user_prefs = None
    if user_id:
        user_prefs = await get_user_design_preferences(user_id, user_type)
    
    return {
        "config": config.model_dump(),
        "userPreferences": user_prefs.model_dump() if user_prefs else None,
        "timestamp": datetime.utcnow().isoformat()
    }


async def track_design_system_analytics(analytics_data: DesignSystemAnalytics) -> None:
    """Track design system usage analytics."""
    db = get_database()
    
    # Store analytics event
    analytics_doc = analytics_data.model_dump()
    analytics_doc["_id"] = ObjectId()
    
    await db.design_system_analytics.insert_one(analytics_doc)
    
    # Update aggregated metrics
    await _update_design_system_metrics(analytics_data)


async def _update_design_system_metrics(analytics_data: DesignSystemAnalytics) -> None:
    """Update aggregated design system metrics."""
    db = get_database()
    
    # Get current metrics or create new
    metrics_doc = await db.design_system_metrics.find_one({"type": "global"})
    
    if not metrics_doc:
        metrics = DesignSystemMetrics()
        metrics_dict = metrics.model_dump()
        metrics_dict["_id"] = ObjectId()
        metrics_dict["type"] = "global"
        await db.design_system_metrics.insert_one(metrics_dict)
        return
    
    # Update performance metrics (rolling average)
    update_doc = {
        "lastUpdated": datetime.utcnow(),
        "$inc": {
            "totalUsers": 1
        }
    }
    
    # Update averages
    if analytics_data.cssLoadTime > 0:
        current_avg = metrics_doc.get("averageLoadTime", 0)
        new_avg = (current_avg + analytics_data.cssLoadTime) / 2
        update_doc["averageLoadTime"] = new_avg
    
    if analytics_data.renderTime > 0:
        current_avg = metrics_doc.get("averageInteractionTime", 0)
        new_avg = (current_avg + analytics_data.renderTime) / 2
        update_doc["averageInteractionTime"] = new_avg
    
    await db.design_system_metrics.update_one(
        {"type": "global"},
        {"$set": update_doc}
    )


async def get_design_system_metrics() -> DesignSystemMetrics:
    """Get aggregated design system metrics."""
    db = get_database()
    
    metrics_doc = await db.design_system_metrics.find_one({"type": "global"})
    
    if not metrics_doc:
        return DesignSystemMetrics()
    
    return DesignSystemMetrics(**metrics_doc)


async def get_popular_design_preferences() -> Dict[str, Any]:
    """Get popular design preferences across all users."""
    db = get_database()
    
    # Aggregate user preferences
    pipeline = [
        {
            "$group": {
                "_id": None,
                "totalUsers": {"$sum": 1},
                "lightMode": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.theme", "light"]}, 1, 0]
                    }
                },
                "darkMode": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.theme", "dark"]}, 1, 0]
                    }
                },
                "autoMode": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.theme", "auto"]}, 1, 0]
                    }
                },
                "fullAnimation": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.animationLevel", "full"]}, 1, 0]
                    }
                },
                "reducedAnimation": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.animationLevel", "reduced"]}, 1, 0]
                    }
                },
                "noAnimation": {
                    "$sum": {
                        "$cond": [{"$eq": ["$preferences.animationLevel", "none"]}, 1, 0]
                    }
                },
                "highContrast": {
                    "$sum": {
                        "$cond": ["$preferences.highContrast", 1, 0]
                    }
                },
                "largeText": {
                    "$sum": {
                        "$cond": ["$preferences.largeText", 1, 0]
                    }
                },
                "reduceMotion": {
                    "$sum": {
                        "$cond": ["$preferences.reduceMotion", 1, 0]
                    }
                }
            }
        }
    ]
    
    result = await db.user_design_preferences.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "totalUsers": 0,
            "themePreferences": {"light": 0, "dark": 0, "auto": 0},
            "animationPreferences": {"full": 0, "reduced": 0, "none": 0},
            "accessibilityPreferences": {
                "highContrast": 0,
                "largeText": 0,
                "reduceMotion": 0
            }
        }
    
    data = result[0]
    
    return {
        "totalUsers": data["totalUsers"],
        "themePreferences": {
            "light": data["lightMode"],
            "dark": data["darkMode"],
            "auto": data["autoMode"]
        },
        "animationPreferences": {
            "full": data["fullAnimation"],
            "reduced": data["reducedAnimation"],
            "none": data["noAnimation"]
        },
        "accessibilityPreferences": {
            "highContrast": data["highContrast"],
            "largeText": data["largeText"],
            "reduceMotion": data["reduceMotion"]
        }
    }


async def cleanup_old_analytics() -> int:
    """Clean up old analytics data (older than 90 days)."""
    db = get_database()
    
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    
    result = await db.design_system_analytics.delete_many({
        "timestamp": {"$lt": cutoff_date}
    })
    
    return result.deleted_count


async def export_design_system_config() -> Dict[str, Any]:
    """Export complete design system configuration for backup/migration."""
    config = await get_design_system_config()
    metrics = await get_design_system_metrics()
    popular_prefs = await get_popular_design_preferences()
    
    return {
        "config": config.model_dump(),
        "metrics": metrics.model_dump(),
        "popularPreferences": popular_prefs,
        "exportedAt": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


async def import_design_system_config(config_data: Dict[str, Any]) -> DesignSystemConfig:
    """Import design system configuration from backup."""
    db = get_database()
    
    if "config" not in config_data:
        raise ValidationError("Invalid configuration data", {"missing": "config"})
    
    # Validate configuration
    try:
        config = DesignSystemConfig(**config_data["config"])
    except Exception as e:
        raise ValidationError("Invalid configuration format", {"error": str(e)})
    
    # Update database
    config_dict = config.model_dump(by_alias=True)
    config_dict["importedAt"] = datetime.utcnow()
    
    await db.design_system_config.replace_one(
        {"environment": "production"},
        config_dict,
        upsert=True
    )
    
    return config


async def reset_design_system_to_defaults() -> DesignSystemConfig:
    """Reset design system to default configuration."""
    db = get_database()
    
    # Create default configuration
    config = DesignSystemConfig()
    config.updatedAt = datetime.utcnow()
    config.updatedBy = "system_reset"
    
    # Replace current configuration
    config_dict = config.model_dump(by_alias=True)
    
    await db.design_system_config.replace_one(
        {"environment": "production"},
        config_dict,
        upsert=True
    )
    
    return config