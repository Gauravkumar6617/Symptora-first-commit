import { Link, Navigate, useParams } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBlogPost } from '@/hooks/useBlogPosts'
import { ApiError } from '@/lib/api'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading, error } = useBlogPost(slug)

  if (!slug || (error instanceof ApiError && error.status === 404)) {
    return <Navigate to="/blog" replace />
  }

  if (isLoading || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {error ? (
          <p className="text-sm text-ink/60">
            Could not load this article.{' '}
            <Link to="/blog" className="font-medium text-primary">Back to blog</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/blog" className="text-sm font-medium text-primary">
        ← Back to blog
      </Link>

      <span className="mt-6 block text-xs font-semibold uppercase tracking-wide text-secondary">
        {post.category}
      </span>
      <h1 className="mt-2 text-3xl font-bold text-ink">{post.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/50">
        <span>{post.author}</span>
        <span>·</span>
        <span>
          {new Date(post.published_at ?? post.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span>·</span>
        <span>{post.read_time}</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl">
        <BlogThumbnail category={post.category} imageUrl={post.cover_image_url} className="h-56 sm:h-72" />
      </div>

      <div className="mt-8 space-y-4">
        {post.paragraphs.map((paragraph, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={index} className="whitespace-pre-line text-base leading-7 text-ink/80">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="card-raised mt-10 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">
            Not sure what your symptoms mean?
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            Run a Health Check and get a risk-based report in minutes.
          </p>
        </div>
        <Link to="/symptom-checker" className="btn-raised whitespace-nowrap">
          Start Health Check
        </Link>
      </div>
    </div>
  )
}
