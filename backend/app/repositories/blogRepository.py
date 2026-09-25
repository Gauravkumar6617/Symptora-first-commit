from sqlalchemy import desc, nulls_last
from sqlalchemy.orm import Session

from app.models.blogModel import BlogPostModel


class BlogRepository:
    def __init__(self, db: Session):
        self.db = db

    def _newest_first(self, query):
        return query.order_by(nulls_last(desc(BlogPostModel.published_at)), desc(BlogPostModel.created_at))

    def list_all(self) -> list[BlogPostModel]:
        return self._newest_first(self.db.query(BlogPostModel)).all()

    def list_published(self) -> list[BlogPostModel]:
        return self._newest_first(
            self.db.query(BlogPostModel).filter(BlogPostModel.is_published.is_(True))
        ).all()

    def get_by_id(self, post_id: str) -> BlogPostModel | None:
        return self.db.query(BlogPostModel).filter(BlogPostModel.id == post_id).first()

    def get_by_slug(self, slug: str) -> BlogPostModel | None:
        return self.db.query(BlogPostModel).filter(BlogPostModel.slug == slug).first()

    def slug_taken(self, slug: str, exclude_id: str | None = None) -> bool:
        query = self.db.query(BlogPostModel.id).filter(BlogPostModel.slug == slug)
        if exclude_id:
            query = query.filter(BlogPostModel.id != exclude_id)
        return query.first() is not None

    def create(self, **values) -> BlogPostModel:
        post = BlogPostModel(**values)
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def save(self, post: BlogPostModel) -> BlogPostModel:
        self.db.commit()
        self.db.refresh(post)
        return post

    def delete(self, post: BlogPostModel) -> None:
        self.db.delete(post)
        self.db.commit()
