"""blog posts written by admins

Revision ID: d4a8c2f6e1b9
Revises: b7d2e4f1a9c3
Create Date: 2026-09-25 18:00:00.000000

"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4a8c2f6e1b9'
down_revision: Union[str, Sequence[str], None] = 'b7d2e4f1a9c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# The guides that shipped hard-coded in web and app, so the blog isn't empty.
SEED_POSTS = [
    {
        "slug": "when-to-see-a-doctor-for-fever",
        "title": "When Should You Actually See a Doctor for a Fever?",
        "category": "Symptom Guide",
        "excerpt": "Not every fever needs an ER visit, but some do. Here is how to tell the difference in under a minute.",
        "author": "Dr. Ananya Rao",
        "date": "2026-08-12",
        "content": [
            "A fever is your body's natural response to infection, and most low-grade fevers resolve on their own within a few days with rest and fluids.",
            "You should seek medical attention if the fever is above 103°F (39.4°C), lasts more than three days, or is accompanied by a stiff neck, confusion, difficulty breathing, or a rash.",
            "For infants under three months, any fever warrants an immediate call to a doctor.",
            "Symptora's Health Check walks through these red flags automatically and tells you whether to self-monitor, book a routine appointment, or start a telemedicine consult right away.",
        ],
    },
    {
        "slug": "managing-elderly-parents-health-remotely",
        "title": "Managing Your Elderly Parents' Health When You Live Far Away",
        "category": "Family Care",
        "excerpt": "Family profiles make it possible to track symptoms, book appointments, and get alerts for a parent who cannot easily do it themselves.",
        "author": "Priya Menon",
        "date": "2026-07-28",
        "content": [
            "Millions of adults manage a parent's healthcare from another city, often piecing together updates over phone calls.",
            "A shared family profile lets you log symptoms on their behalf, see risk reports as they come in, and get notified immediately if a check comes back high risk.",
            "It also keeps a single history of prescriptions and past consultations, so nothing gets lost between different doctors or hospital visits.",
        ],
    },
    {
        "slug": "understanding-your-risk-score",
        "title": "Understanding Your Symptora Risk Score",
        "category": "Product",
        "excerpt": "What Low, Medium, and High risk actually mean, and what happens next in each case.",
        "author": "Symptora Clinical Team",
        "date": "2026-07-10",
        "content": [
            "Every Health Check runs your reported symptoms and vitals through a triage model trained alongside clinicians.",
            "Low risk usually means self-care is appropriate, with guidance on what to watch for.",
            "Medium risk suggests booking a routine appointment within the next day or two.",
            "High risk automatically opens a telemedicine request with an available doctor so you are not left waiting.",
        ],
    },
    {
        "slug": "reducing-unnecessary-er-visits",
        "title": "5 Ways to Avoid an Unnecessary ER Visit",
        "category": "Wellness",
        "excerpt": "Emergency rooms are for emergencies. Here is how to know when urgent care or a video consult is the better call.",
        "author": "Dr. Karan Shah",
        "date": "2026-06-22",
        "content": [
            "ERs are built for life-threatening emergencies, and unnecessary visits mean longer waits for people who truly need them.",
            "A quick symptom check can rule out red-flag conditions and point you toward urgent care, a telemedicine visit, or home care instead.",
            "Keeping a running health history also helps any doctor you see quickly understand your baseline and recent changes.",
        ],
    },
]


def upgrade() -> None:
    blog_posts = op.create_table('blog_posts',
    sa.Column('id', sa.UUID(as_uuid=False), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('title', sa.String(length=160), nullable=False),
    sa.Column('category', sa.String(length=40), nullable=False),
    sa.Column('excerpt', sa.String(length=300), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('author', sa.String(length=80), nullable=False),
    sa.Column('cover_image', sa.String(), nullable=True),
    sa.Column('is_published', sa.Boolean(), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by_id', sa.UUID(as_uuid=False), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blog_posts_id'), 'blog_posts', ['id'], unique=False)
    op.create_index(op.f('ix_blog_posts_slug'), 'blog_posts', ['slug'], unique=True)
    op.create_index(op.f('ix_blog_posts_published_at'), 'blog_posts', ['published_at'], unique=False)

    op.bulk_insert(blog_posts, [
        {
            "id": str(uuid.uuid4()),
            "slug": post["slug"],
            "title": post["title"],
            "category": post["category"],
            "excerpt": post["excerpt"],
            "content": "\n\n".join(post["content"]),
            "author": post["author"],
            "cover_image": None,
            "is_published": True,
            "published_at": datetime.fromisoformat(post["date"]).replace(tzinfo=timezone.utc),
            "created_by_id": None,
        }
        for post in SEED_POSTS
    ])


def downgrade() -> None:
    op.drop_index(op.f('ix_blog_posts_published_at'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_slug'), table_name='blog_posts')
    op.drop_index(op.f('ix_blog_posts_id'), table_name='blog_posts')
    op.drop_table('blog_posts')
