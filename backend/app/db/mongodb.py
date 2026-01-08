"""MongoDB connection using Motor."""
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

settings = get_settings()

# Global MongoDB client
client: Optional[AsyncIOMotorClient] = None
database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    """Connect to MongoDB."""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    database = client[settings.MONGODB_DB]
    # Test connection
    await client.admin.command("ping")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database
