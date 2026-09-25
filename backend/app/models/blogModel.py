from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.familyMemeberModel import gen_uuid


class BlogPostModel(BaseModel):
    """A health guide written by an admin; published posts show on web and app."""

    __tablename__ = "blog_posts"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    title = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False)
    excerpt = Column(String(300), nullable=False)
    # Plain text; a blank line starts a new paragraph.
    content = Column(Text, nullable=False)
    author = Column(String(80), nullable=False)
    # R2 key from POST /admin/blogs/image, or an absolute image url.
    cover_image = Column(String, nullable=True)
    is_published = Column(Boolean, nullable=False, default=True)
    # Set the first time the post goes live; drives ordering.
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_by = relationship("UserModel", foreign_keys=[created_by_id])
