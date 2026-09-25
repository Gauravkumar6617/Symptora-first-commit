import logging
import re
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.blogRepository import BlogRepository
from app.schemas.blog import BlogPostCreate, BlogPostUpdate
from app.utils.integration.cloudflarR2.index import delete_key, file_url, upload_image

logger = logging.getLogger(__name__)


class BlogPostNotFoundError(Exception):
    pass


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:100].rstrip("-") or "post"


def _drop_stored_image(key: str | None) -> None:
    # Absolute urls were pasted in, not uploaded; there's nothing of ours to delete.
    if key and not key.startswith("http"):
        try:
            delete_key(key)
        except Exception:
            logger.warning("Could not delete blog image %s", key)


class BlogService:
    def __init__(self, db: Session):
        self.repo = BlogRepository(db)

    def _unique_slug(self, title: str, exclude_id: str | None = None) -> str:
        base = slugify(title)
        slug, n = base, 2
        while self.repo.slug_taken(slug, exclude_id):
            slug = f"{base}-{n}"
            n += 1
        return slug

    # ------------------------------------------------------------ public

    def list_published(self):
        return self.repo.list_published()

    def get_published(self, slug: str):
        post = self.repo.get_by_slug(slug)
        if post is None or not post.is_published:
            raise BlogPostNotFoundError()
        return post

    # ------------------------------------------------------------- admin

    def list_all(self):
        return self.repo.list_all()

    def create(self, data: BlogPostCreate, author_id: str):
        values = data.model_dump()
        values["cover_image"] = values["cover_image"] or None
        return self.repo.create(
            **values,
            slug=self._unique_slug(data.title),
            published_at=datetime.now(timezone.utc) if data.is_published else None,
            created_by_id=author_id,
        )

    def update(self, post_id: str, data: BlogPostUpdate):
        post = self.repo.get_by_id(post_id)
        if post is None:
            raise BlogPostNotFoundError()

        changes = data.model_dump(exclude_unset=True)
        old_image = post.cover_image
        if "cover_image" in changes:
            changes["cover_image"] = changes["cover_image"] or None
        # The link stays stable once shared; only a draft follows its title.
        if "title" in changes and post.published_at is None:
            post.slug = self._unique_slug(changes["title"], exclude_id=post.id)
        for field, value in changes.items():
            setattr(post, field, value)
        if post.is_published and post.published_at is None:
            post.published_at = datetime.now(timezone.utc)

        post = self.repo.save(post)
        if "cover_image" in changes and old_image != post.cover_image:
            _drop_stored_image(old_image)
        return post

    def delete(self, post_id: str) -> None:
        post = self.repo.get_by_id(post_id)
        if post is None:
            raise BlogPostNotFoundError()
        image = post.cover_image
        self.repo.delete(post)
        _drop_stored_image(image)

    @staticmethod
    def upload_image(file: UploadFile) -> dict:
        key = upload_image(file, "blog")
        return {"cover_image": key, "cover_image_url": file_url(key)}
