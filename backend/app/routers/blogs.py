"""Blog management router for super admin portal."""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from bson import ObjectId

from app.core.security import require_admin
from app.core.cloudinary import upload_image
from app.db.mongodb import get_database
from app.models.blog import (
    BlogPost,
    BlogCreateRequest,
    BlogUpdateRequest,
    BlogListResponse,
    BlogImage,
    BlogImageUploadResponse,
    BlogSEOUpdateRequest,
    BlogPublishRequest,
    WorkspaceSelectionOption,
)

router = APIRouter(prefix="/blogs", tags=["Blog Management"])


@router.get("/")
async def list_blogs(
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """List all blog posts with filtering and pagination."""
    filter_query: Dict[str, Any] = {}

    if status_filter:
        filter_query["status"] = status_filter
    if category:
        filter_query["categories"] = category
    if tag:
        filter_query["tags"] = tag
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    total = await db.blogs.count_documents(filter_query)
    total_pages = max(1, (total + limit - 1) // limit)
    skip = (page - 1) * limit

    cursor = db.blogs.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)

    blogs = []
    async for doc in cursor:
        blogs.append(_serialize_blog(doc))

    return BlogListResponse(
        blogs=blogs,
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


@router.get("/workspaces/search")
async def search_workspaces_for_blog(
    query: Optional[str] = None,
    city: Optional[str] = None,
    locality: Optional[str] = None,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Search published workspaces to associate with blog posts."""
    filter_query: Dict[str, Any] = {"isPublished": True}

    if query:
        filter_query["$or"] = [
            {"displayName": {"$regex": query, "$options": "i"}},
            {"location.locality": {"$regex": query, "$options": "i"}},
            {"location.city": {"$regex": query, "$options": "i"}},
        ]
    if city:
        filter_query["location.city"] = {"$regex": city, "$options": "i"}
    if locality:
        filter_query["location.locality"] = {"$regex": locality, "$options": "i"}

    cursor = db.premium_listings.find(filter_query).limit(50)

    workspaces = []
    async for ws in cursor:
        hero_images = []
        for photo in (ws.get("heroPhotos") or [])[:5]:
            hero_images.append(
                BlogImage(
                    url=photo.get("url", ""),
                    publicId=photo.get("publicId", ""),
                    width=photo.get("width", 0),
                    height=photo.get("height", 0),
                    bytes=photo.get("bytes", 0),
                    format=photo.get("format", ""),
                    altText=ws.get("displayName", ""),
                    caption=f"{ws.get('displayName', '')} workspace",
                )
            )

        workspaces.append(
            WorkspaceSelectionOption(
                workspaceId=str(ws["_id"]),
                displayName=ws.get("displayName", ""),
                slug=ws.get("slugData", {}).get("slug", ""),
                locality=ws.get("location", {}).get("locality", ""),
                city=ws.get("location", {}).get("city", "Delhi"),
                heroPhotos=hero_images,
                isAvailable=True,
            )
        )

    return workspaces


@router.get("/categories/stats")
async def get_blog_category_stats(
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Get statistics about blog categories."""
    pipeline = [
        {"$match": {"status": "published"}},
        {"$unwind": "$categories"},
        {
            "$group": {
                "_id": "$categories",
                "count": {"$sum": 1},
                "latestPost": {"$max": "$publishedAt"},
            }
        },
        {"$sort": {"count": -1}},
    ]
    categories = []
    async for cat in db.blogs.aggregate(pipeline):
        categories.append(
            {"name": cat["_id"], "count": cat["count"], "latestPost": cat.get("latestPost")}
        )
    return categories


@router.get("/{blog_id}")
async def get_blog(
    blog_id: str,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Get a specific blog post by ID."""
    if not ObjectId.is_valid(blog_id):
        raise HTTPException(status_code=400, detail="Invalid blog ID format")

    doc = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog not found")

    return _serialize_blog(doc)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_blog(
    blog_data: BlogCreateRequest,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Create a new blog post."""
    # Generate a URL-safe slug from title
    raw_slug = blog_data.title.lower()
    for ch in " /\\?#&=+%":
        raw_slug = raw_slug.replace(ch, "-")
    slug = f"/blog/{raw_slug[:100]}"

    # Resolve collision
    counter = 1
    base_slug = slug
    while await db.blogs.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Resolve associated workspaces
    associated_workspaces = await _resolve_workspaces(
        db, blog_data.associatedWorkspaceIds or []
    )

    # Word count
    word_count = sum(
        len(block.content.split()) for block in (blog_data.contentBlocks or []) if block.content
    )

    author_id_raw = current_admin.get("adminId") or current_admin.get("sub") or "unknown"

    doc: Dict[str, Any] = {
        "authorId": author_id_raw,
        "title": blog_data.title,
        "slug": slug,
        "excerpt": blog_data.excerpt or (blog_data.title[:150] + "..."),
        "contentBlocks": [b.dict() for b in (blog_data.contentBlocks or [])],
        "categories": blog_data.categories or [],
        "tags": blog_data.tags or [],
        "associatedWorkspaces": associated_workspaces,
        "status": blog_data.status,
        "allowComments": blog_data.allowComments,
        "isFeatured": blog_data.isFeatured,
        "wordCount": word_count,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "lastEditedAt": datetime.utcnow(),
    }

    if blog_data.featuredImage:
        doc["featuredImage"] = blog_data.featuredImage.dict()
    if blog_data.scheduledFor:
        doc["scheduledFor"] = blog_data.scheduledFor
    if blog_data.status == "published":
        doc["publishedAt"] = datetime.utcnow()

    result = await db.blogs.insert_one(doc)
    created = await db.blogs.find_one({"_id": result.inserted_id})
    return _serialize_blog(created)


@router.put("/{blog_id}")
async def update_blog(
    blog_id: str,
    blog_data: BlogUpdateRequest,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Update an existing blog post."""
    if not ObjectId.is_valid(blog_id):
        raise HTTPException(status_code=400, detail="Invalid blog ID format")

    existing = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")

    update: Dict[str, Any] = {
        "updatedAt": datetime.utcnow(),
        "lastEditedAt": datetime.utcnow(),
    }

    if blog_data.title is not None:
        update["title"] = blog_data.title
    if blog_data.excerpt is not None:
        update["excerpt"] = blog_data.excerpt
    if blog_data.contentBlocks is not None:
        update["contentBlocks"] = [b.dict() for b in blog_data.contentBlocks]
        update["wordCount"] = sum(
            len(b.content.split()) for b in blog_data.contentBlocks if b.content
        )
    if blog_data.categories is not None:
        update["categories"] = blog_data.categories
    if blog_data.tags is not None:
        update["tags"] = blog_data.tags
    if blog_data.featuredImage is not None:
        update["featuredImage"] = blog_data.featuredImage.dict()
    if blog_data.associatedWorkspaceIds is not None:
        update["associatedWorkspaces"] = await _resolve_workspaces(
            db, blog_data.associatedWorkspaceIds
        )
    if blog_data.status is not None:
        update["status"] = blog_data.status
        if blog_data.status == "published" and not existing.get("publishedAt"):
            update["publishedAt"] = datetime.utcnow()
    if blog_data.scheduledFor is not None:
        update["scheduledFor"] = blog_data.scheduledFor
    if blog_data.allowComments is not None:
        update["allowComments"] = blog_data.allowComments
    if blog_data.isFeatured is not None:
        update["isFeatured"] = blog_data.isFeatured
    if blog_data.isSticky is not None:
        update["isSticky"] = blog_data.isSticky
    if blog_data.editorNotes is not None:
        update["editorNotes"] = blog_data.editorNotes

    await db.blogs.update_one({"_id": ObjectId(blog_id)}, {"$set": update})
    updated = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    return _serialize_blog(updated)


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(
    blog_id: str,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Soft-delete (archive) a blog post."""
    if not ObjectId.is_valid(blog_id):
        raise HTTPException(status_code=400, detail="Invalid blog ID format")

    existing = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")

    await db.blogs.update_one(
        {"_id": ObjectId(blog_id)},
        {"$set": {"status": "archived", "updatedAt": datetime.utcnow()}},
    )


@router.post("/upload-image")
async def upload_blog_image_endpoint(
    file: UploadFile = File(...),
    alt_text: str = Form(""),
    caption: str = Form(""),
    image_type: str = Form("content"),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Upload an image for blog content (stored under kosmixspaces/blogs/)."""
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10 MB limit")

    result = await upload_image(file_bytes, "kosmixspaces/blogs")

    blog_image = BlogImage(
        url=result["secure_url"],
        publicId=result["public_id"],
        width=result["width"],
        height=result["height"],
        bytes=result["bytes"],
        format=result["format"],
        altText=alt_text or (file.filename or ""),
        caption=caption,
        imageType=image_type,  # type: ignore[arg-type]
    )

    return BlogImageUploadResponse(image=blog_image, tempPublicId=result["public_id"])


@router.put("/{blog_id}/seo")
async def update_blog_seo(
    blog_id: str,
    seo_data: BlogSEOUpdateRequest,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Create or update SEO metadata for a blog post."""
    if not ObjectId.is_valid(blog_id):
        raise HTTPException(status_code=400, detail="Invalid blog ID format")

    existing = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")

    base_seo = existing.get("seoMetadata") or {}

    # Overlay only the provided fields
    merged = {
        "metaTitle": seo_data.metaTitle or base_seo.get("metaTitle") or existing.get("title", ""),
        "metaDescription": seo_data.metaDescription or base_seo.get("metaDescription") or existing.get("excerpt", "")[:160],
        "keywords": seo_data.keywords if seo_data.keywords is not None else base_seo.get("keywords", []),
        "ogTitle": seo_data.ogTitle or base_seo.get("ogTitle") or existing.get("title", ""),
        "ogDescription": seo_data.ogDescription or base_seo.get("ogDescription") or existing.get("excerpt", "")[:160],
        "ogImage": seo_data.ogImage or base_seo.get("ogImage") or (existing.get("featuredImage") or {}).get("url"),
        "twitterTitle": seo_data.twitterTitle or base_seo.get("twitterTitle") or existing.get("title", ""),
        "twitterDescription": seo_data.twitterDescription or base_seo.get("twitterDescription") or existing.get("excerpt", "")[:160],
        "twitterImage": seo_data.twitterImage or base_seo.get("twitterImage") or (existing.get("featuredImage") or {}).get("url"),
        "canonicalUrl": seo_data.canonicalUrl or base_seo.get("canonicalUrl") or f"https://kosmixspaces.com{existing.get('slug', '')}",
        "autoGenerated": False,
        "lastUpdated": datetime.utcnow(),
    }

    await db.blogs.update_one(
        {"_id": ObjectId(blog_id)},
        {"$set": {"seoMetadata": merged, "updatedAt": datetime.utcnow()}},
    )
    updated = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    return _serialize_blog(updated)


@router.post("/{blog_id}/publish")
async def publish_blog(
    blog_id: str,
    publish_data: BlogPublishRequest,
    db=Depends(get_database),
    current_admin: Dict[str, Any] = Depends(require_admin),
):
    """Publish a blog post (immediately or scheduled)."""
    if not ObjectId.is_valid(blog_id):
        raise HTTPException(status_code=400, detail="Invalid blog ID format")

    existing = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")

    update: Dict[str, Any] = {"status": "published", "updatedAt": datetime.utcnow()}

    if publish_data.publishNow:
        update["publishedAt"] = datetime.utcnow()
        update["scheduledFor"] = None
    elif publish_data.scheduledFor:
        update["scheduledFor"] = publish_data.scheduledFor
        update["publishedAt"] = None

    await db.blogs.update_one({"_id": ObjectId(blog_id)}, {"$set": update})
    updated = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    return _serialize_blog(updated)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_blog(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a MongoDB document to a JSON-serialisable dict."""
    doc = dict(doc)
    doc["blogId"] = str(doc.pop("_id"))
    # authorId may be an ObjectId or a plain string
    if isinstance(doc.get("authorId"), ObjectId):
        doc["authorId"] = str(doc["authorId"])

    # Convert workspaceId inside associatedWorkspaces
    for ws in doc.get("associatedWorkspaces") or []:
        if isinstance(ws.get("workspaceId"), ObjectId):
            ws["workspaceId"] = str(ws["workspaceId"])

    return doc


async def _resolve_workspaces(db, workspace_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetch workspace details and build the associatedWorkspaces sub-documents."""
    result = []
    for wid in workspace_ids:
        if not ObjectId.is_valid(wid):
            continue
        ws = await db.premium_listings.find_one({"_id": ObjectId(wid)})
        if not ws:
            continue

        images = []
        for photo in (ws.get("heroPhotos") or [])[:5]:
            images.append(
                {
                    "url": photo.get("url", ""),
                    "publicId": photo.get("publicId", ""),
                    "width": photo.get("width", 0),
                    "height": photo.get("height", 0),
                    "bytes": photo.get("bytes", 0),
                    "format": photo.get("format", ""),
                    "altText": ws.get("displayName", ""),
                    "caption": f"{ws.get('displayName', '')} workspace",
                    "imageType": "workspace",
                }
            )

        result.append(
            {
                "workspaceId": str(ws["_id"]),
                "slug": ws.get("slugData", {}).get("slug", ""),
                "displayName": ws.get("displayName", ""),
                "locality": ws.get("location", {}).get("locality", ""),
                "city": ws.get("location", {}).get("city", "Delhi"),
                "workspaceImages": images,
                "linkType": "related",
                "showInSidebar": True,
                "showInContent": False,
            }
        )
    return result


# ---------------------------------------------------------------------------
# Public endpoints (no auth required)
# ---------------------------------------------------------------------------

from fastapi import APIRouter as _APIRouter

public_router = _APIRouter(prefix="/blogs", tags=["Blog Public"])


@public_router.get("/")
async def public_list_blogs(
    page: int = 1,
    limit: int = 12,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_database),
):
    """List published blog posts for the public site."""
    filter_query: Dict[str, Any] = {"status": "published"}

    if category:
        filter_query["categories"] = category
    if tag:
        filter_query["tags"] = tag
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    total = await db.blogs.count_documents(filter_query)
    total_pages = max(1, (total + limit - 1) // limit)
    skip = (page - 1) * limit

    cursor = (
        db.blogs.find(
            filter_query,
            # Only return fields needed for the card
            {
                "title": 1, "slug": 1, "excerpt": 1, "featuredImage": 1,
                "categories": 1, "tags": 1, "publishedAt": 1, "wordCount": 1,
                "readingTime": 1, "isFeatured": 1,
                "associatedWorkspaces.displayName": 1,
                "associatedWorkspaces.slug": 1,
            },
        )
        .sort([("isFeatured", -1), ("publishedAt", -1)])
        .skip(skip)
        .limit(limit)
    )

    blogs = []
    async for doc in cursor:
        blogs.append(_serialize_blog(doc))

    return {"blogs": blogs, "total": total, "page": page, "limit": limit, "totalPages": total_pages}


@public_router.get("/categories")
async def public_blog_categories(db=Depends(get_database)):
    """Return all categories that have at least one published post."""
    pipeline = [
        {"$match": {"status": "published"}},
        {"$unwind": "$categories"},
        {"$group": {"_id": "$categories", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = []
    async for doc in db.blogs.aggregate(pipeline):
        result.append({"name": doc["_id"], "count": doc["count"]})
    return result


@public_router.get("/{slug:path}")
async def public_get_blog(slug: str, db=Depends(get_database)):
    """Get a single published blog post by slug (e.g. /blog/my-post-title)."""
    # slug comes in without leading slash from the path param
    full_slug = f"/blog/{slug}" if not slug.startswith("/blog/") else slug

    doc = await db.blogs.find_one({"slug": full_slug, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Increment view count asynchronously (fire and forget)
    await db.blogs.update_one(
        {"_id": doc["_id"]},
        {"$inc": {"analytics.viewCount": 1}, "$set": {"analytics.lastViewedAt": datetime.utcnow()}},
    )

    return _serialize_blog(doc)
