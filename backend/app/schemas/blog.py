import math
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field, model_validator

from app.schemas.common import ORMReadBase
from app.utils.integration.cloudflarR2.index import file_url


class BlogPostBase(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    category: str = Field(min_length=2, max_length=40)
    excerpt: str = Field(min_length=10, max_length=300)
    # Plain text; a blank line starts a new paragraph.
    content: str = Field(min_length=20)
    author: str = Field(min_length=2, max_length=80)
    cover_image: Optional[str] = None
    is_published: bool = True


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=160)
    category: Optional[str] = Field(default=None, min_length=2, max_length=40)
    excerpt: Optional[str] = Field(default=None, min_length=10, max_length=300)
    content: Optional[str] = Field(default=None, min_length=20)
    author: Optional[str] = Field(default=None, min_length=2, max_length=80)
    # "" removes the cover image.
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None


class BlogPostRead(BlogPostBase, ORMReadBase):
    slug: str
    published_at: Optional[datetime] = None
    # Presigned, short-lived download url derived from ``cover_image``.
    cover_image_url: Optional[str] = None

    @computed_field
    @property
    def paragraphs(self) -> List[str]:
        return [p.strip() for p in self.content.replace("\r\n", "\n").split("\n\n") if p.strip()]

    @computed_field
    @property
    def read_time(self) -> str:
        minutes = max(1, math.ceil(len(self.content.split()) / 200))
        return f"{minutes} min read"

    @model_validator(mode="after")
    def _attach_cover_url(self):
        if self.cover_image and not self.cover_image_url:
            self.cover_image_url = file_url(self.cover_image)
        return self


class BlogImageUpload(BaseModel):
    cover_image: str  # the key to send as BlogPostBase.cover_image
    cover_image_url: str  # preview url
