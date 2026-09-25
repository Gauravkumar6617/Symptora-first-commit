import { Link, Navigate, useParams } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import { getBlogPostBySlug } from '@/data/blogPosts'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getBlogPostBySlug(slug) : undefined

  if (!post) {
    return <Navigate to="/blog" replace />
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
      <div className="mt-3 flex items-center gap-3 text-sm text-ink/50">
        <span>{post.author}</span>
        <span>·</span>
        <span>
          {new Date(post.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span>·</span>
        <span>{post.readTime}</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl">
        <BlogThumbnail category={post.category} className="h-56" />
      </div>

      <div className="mt-8 space-y-4">
        {post.content.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-base leading-7 text-ink/80">
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
