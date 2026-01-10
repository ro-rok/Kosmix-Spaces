"""
Performance monitoring and optimization endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

from app.core.security import get_current_admin
from app.services.performance_service import (
    performance_cache,
    performance_monitor,
    DatabaseOptimizer,
    ImageOptimizer
)
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/performance", tags=["performance"])

@router.get("/cache/stats")
async def get_cache_stats(
    current_admin = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Get cache performance statistics (Admin only)"""
    try:
        stats = performance_cache.get_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cache statistics"
        )

@router.post("/cache/clear")
async def clear_cache(
    current_admin = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Clear performance cache (Admin only)"""
    try:
        performance_cache.clear()
        return {
            "success": True,
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear cache"
        )

@router.get("/metrics")
async def get_performance_metrics(
    duration_hours: int = 1,
    current_admin = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Get performance metrics for the specified duration (Admin only)"""
    try:
        duration_seconds = duration_hours * 3600
        
        # Get system metrics
        system_metrics = performance_monitor.get_system_metrics()
        
        # Get application metrics
        app_metrics = {}
        metric_names = [
            'api_request_execution_time',
            'database_query_execution_time',
            'image_upload_execution_time',
            'search_execution_time'
        ]
        
        for metric_name in metric_names:
            summary = performance_monitor.get_metric_summary(metric_name, duration_seconds)
            if summary:
                app_metrics[metric_name] = summary
        
        return {
            "success": True,
            "data": {
                "system_metrics": system_metrics,
                "application_metrics": app_metrics,
                "duration_hours": duration_hours
            }
        }
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics"
        )

@router.post("/database/optimize")
async def optimize_database(
    current_admin = Depends(get_current_admin),
    db = Depends(get_database)
) -> Dict[str, Any]:
    """Optimize database performance by creating indexes (Admin only)"""
    try:
        optimizer = DatabaseOptimizer(db)
        indexes_created = await optimizer.create_indexes()
        
        return {
            "success": True,
            "message": "Database optimization completed",
            "data": {
                "indexes_created": indexes_created
            }
        }
    except Exception as e:
        logger.error(f"Failed to optimize database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize database"
        )

@router.post("/database/analyze")
async def analyze_query_performance(
    collection: str,
    query: Dict[str, Any],
    current_admin = Depends(get_current_admin),
    db = Depends(get_database)
) -> Dict[str, Any]:
    """Analyze query performance for a specific collection (Admin only)"""
    try:
        # Validate collection name
        allowed_collections = ['listings', 'partners', 'leads', 'analytics_events']
        if collection not in allowed_collections:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Collection must be one of: {allowed_collections}"
            )
        
        optimizer = DatabaseOptimizer(db)
        analysis = await optimizer.analyze_query_performance(collection, query)
        
        return {
            "success": True,
            "data": {
                "collection": collection,
                "query": query,
                "analysis": analysis
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze query performance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze query performance"
        )

@router.get("/images/optimize-url")
async def get_optimized_image_url(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: str = "auto",
    format: str = "auto"
) -> Dict[str, Any]:
    """Get optimized image URL for given parameters"""
    try:
        optimized_url = ImageOptimizer.get_optimized_url(
            public_id=public_id,
            width=width,
            height=height,
            quality=quality,
            format=format
        )
        
        return {
            "success": True,
            "data": {
                "original_public_id": public_id,
                "optimized_url": optimized_url,
                "parameters": {
                    "width": width,
                    "height": height,
                    "quality": quality,
                    "format": format
                }
            }
        }
    except Exception as e:
        logger.error(f"Failed to generate optimized image URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate optimized image URL"
        )

@router.get("/images/responsive-urls")
async def get_responsive_image_urls(
    public_id: str,
    breakpoints: Optional[List[int]] = None
) -> Dict[str, Any]:
    """Get responsive image URLs for different breakpoints"""
    try:
        if breakpoints is None:
            breakpoints = [320, 640, 768, 1024, 1280, 1920]
        
        responsive_urls = ImageOptimizer.get_responsive_urls(
            public_id=public_id,
            breakpoints=breakpoints
        )
        
        return {
            "success": True,
            "data": {
                "public_id": public_id,
                "breakpoints": breakpoints,
                "responsive_urls": responsive_urls,
                "thumbnail_url": ImageOptimizer.get_thumbnail_url(public_id)
            }
        }
    except Exception as e:
        logger.error(f"Failed to generate responsive image URLs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate responsive image URLs"
        )

@router.get("/health")
async def performance_health_check() -> Dict[str, Any]:
    """Health check endpoint with performance metrics"""
    try:
        # Get basic system metrics
        system_metrics = performance_monitor.get_system_metrics()
        
        # Determine health status based on metrics
        health_status = "healthy"
        warnings = []
        
        if system_metrics.get('cpu_percent', 0) > 80:
            health_status = "warning"
            warnings.append("High CPU usage")
        
        if system_metrics.get('memory_percent', 0) > 85:
            health_status = "warning"
            warnings.append("High memory usage")
        
        cache_stats = system_metrics.get('cache_stats', {})
        if cache_stats.get('memory_usage_mb', 0) > 100:  # 100MB cache limit
            health_status = "warning"
            warnings.append("High cache memory usage")
        
        return {
            "success": True,
            "status": health_status,
            "warnings": warnings,
            "metrics": system_metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Performance health check failed: {e}")
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/recommendations")
async def get_performance_recommendations(
    current_admin = Depends(get_current_admin)
) -> Dict[str, Any]:
    """Get performance optimization recommendations (Admin only)"""
    try:
        recommendations = []
        
        # Analyze system metrics
        system_metrics = performance_monitor.get_system_metrics()
        
        # CPU recommendations
        cpu_percent = system_metrics.get('cpu_percent', 0)
        if cpu_percent > 70:
            recommendations.append({
                "type": "cpu",
                "severity": "high" if cpu_percent > 90 else "medium",
                "message": f"High CPU usage ({cpu_percent:.1f}%). Consider scaling up or optimizing queries.",
                "actions": [
                    "Review slow database queries",
                    "Implement query caching",
                    "Consider horizontal scaling"
                ]
            })
        
        # Memory recommendations
        memory_percent = system_metrics.get('memory_percent', 0)
        if memory_percent > 80:
            recommendations.append({
                "type": "memory",
                "severity": "high" if memory_percent > 95 else "medium",
                "message": f"High memory usage ({memory_percent:.1f}%). Consider optimizing memory usage.",
                "actions": [
                    "Clear performance cache",
                    "Optimize data structures",
                    "Implement pagination for large datasets"
                ]
            })
        
        # Cache recommendations
        cache_stats = system_metrics.get('cache_stats', {})
        cache_memory = cache_stats.get('memory_usage_mb', 0)
        if cache_memory > 50:  # 50MB threshold
            recommendations.append({
                "type": "cache",
                "severity": "low",
                "message": f"Cache using {cache_memory:.1f}MB. Consider tuning cache TTL.",
                "actions": [
                    "Reduce cache TTL for less frequently accessed data",
                    "Implement cache size limits",
                    "Monitor cache hit rates"
                ]
            })
        
        # Database recommendations
        recommendations.append({
            "type": "database",
            "severity": "low",
            "message": "Regular database maintenance recommended.",
            "actions": [
                "Run database optimization",
                "Analyze slow queries",
                "Update database indexes"
            ]
        })
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "system_metrics": system_metrics,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Failed to generate performance recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate performance recommendations"
        )