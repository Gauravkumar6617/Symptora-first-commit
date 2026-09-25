from typing import List

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.controllers.blogController import BlogController
from app.core.database import get_db
from app.deps.auth import get_current_admin
from app.models.userModel import UserModel
from app.schemas.blog import BlogImageUpload, BlogPostCreate, BlogPostRead, BlogPostUpdate
from app.services.blogService import BlogService

# Public: what web and app show. Admin: writing and managing posts.
router = APIRouter(prefix="/blogs", tags=["Blog"])
admin_router = APIRouter(prefix="/admin/blogs", tags=["Admin"])


def get_blog_service(db: Session = Depends(get_db)) -> BlogService:
    return BlogService(db)


@router.get("", response_model=List[BlogPostRead])
def list_published_posts(service: BlogService = Depends(get_blog_service)):
    """Published posts, newest first. No login needed."""
    return service.list_published()


@router.get("/{slug}", response_model=BlogPostRead)
def get_published_post(slug: str, service: BlogService = Depends(get_blog_service)):
    return BlogController.get_published(slug, service)


@admin_router.get("", response_model=List[BlogPostRead])
def list_all_posts(
    current_admin: UserModel = Depends(get_current_admin),
    service: BlogService = Depends(get_blog_service),
):
    """Every post, drafts included."""
    return service.list_all()


@admin_router.post("", response_model=BlogPostRead, status_code=status.HTTP_201_CREATED)
def create_post(
    data: BlogPostCreate,
    current_admin: UserModel = Depends(get_current_admin),
    service: BlogService = Depends(get_blog_service),
):
    return BlogController.create(data, current_admin.id, service)


@admin_router.post("/image", response_model=BlogImageUpload, status_code=status.HTTP_201_CREATED)
def upload_post_image(
    file: UploadFile = File(...),
    current_admin: UserModel = Depends(get_current_admin),
):
    """Store a cover image (png/jpeg/webp); send the returned key as ``cover_image``."""
    return BlogService.upload_image(file)


@admin_router.patch("/{post_id}", response_model=BlogPostRead)
def update_post(
    post_id: str,
    data: BlogPostUpdate,
    current_admin: UserModel = Depends(get_current_admin),
    service: BlogService = Depends(get_blog_service),
):
    """Only the fields sent change. A published post keeps its link (slug)."""
    return BlogController.update(post_id, data, service)


@admin_router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    service: BlogService = Depends(get_blog_service),
):
    BlogController.delete(post_id, service)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
