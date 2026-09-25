from fastapi import HTTPException, status

from app.schemas.blog import BlogPostCreate, BlogPostUpdate
from app.services.blogService import BlogPostNotFoundError, BlogService

POST_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")


class BlogController:

    @staticmethod
    def get_published(slug: str, service: BlogService):
        try:
            return service.get_published(slug)
        except BlogPostNotFoundError:
            raise POST_NOT_FOUND

    @staticmethod
    def create(data: BlogPostCreate, author_id: str, service: BlogService):
        try:
            return service.create(data, author_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not create the post: {e}",
            )

    @staticmethod
    def update(post_id: str, data: BlogPostUpdate, service: BlogService):
        try:
            return service.update(post_id, data)
        except BlogPostNotFoundError:
            raise POST_NOT_FOUND

    @staticmethod
    def delete(post_id: str, service: BlogService):
        try:
            service.delete(post_id)
        except BlogPostNotFoundError:
            raise POST_NOT_FOUND
