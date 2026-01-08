"""Common models and utilities."""
from datetime import datetime, timezone
from typing import Optional, Any
from bson import ObjectId
from pydantic import BaseModel, Field, field_validator
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic."""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, handler):
        field_schema.update(type="string", format="objectid")
        return field_schema


class TimestampMixin(BaseModel):
    """Mixin for createdAt and updatedAt fields."""
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def update_timestamp(self):
        """Update the updatedAt timestamp."""
        self.updatedAt = datetime.now(timezone.utc)


def to_objectid(value: str) -> ObjectId:
    """Convert string to ObjectId."""
    if isinstance(value, ObjectId):
        return value
    if not ObjectId.is_valid(value):
        raise ValueError(f"Invalid ObjectId: {value}")
    return ObjectId(value)


def objectid_to_str(value: ObjectId) -> str:
    """Convert ObjectId to string."""
    if isinstance(value, str):
        return value
    return str(value)
