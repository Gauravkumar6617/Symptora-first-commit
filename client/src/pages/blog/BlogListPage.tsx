import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import { BlogCardSkeleton } from '@/components/ui/Skeleton'
import { blogPosts } from '@/data/blogPosts'

export function BlogListPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Health Blog</h1>
        <p className="mt-2 text-sm text-ink/60">
          Practical, clinician-reviewed guidance on symptoms, family care, and
          getting the right kind of help at the right time.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <BlogCardSkeleton key={i} />
            ))
          : blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="card-raised flex flex-col overflow-hidden"
              >
                <BlogThumbnail category={post.category} className="h-36" />
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    {post.category}
                  </span>
                  <h2 className="mt-2 text-base font-semibold text-ink">
                    {post.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-ink/60">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-ink/50">
                    <span>{post.author}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  )
}
