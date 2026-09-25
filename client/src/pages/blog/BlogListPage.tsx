import { Link } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import { BlogCardSkeleton } from '@/components/ui/Skeleton'
import { useBlogPosts } from '@/hooks/useBlogPosts'

export function BlogListPage() {
  const { data: posts, isLoading, isError, refetch } = useBlogPosts()

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Health Blog</h1>
        <p className="mt-2 text-sm text-ink/60">
          Practical, clinician-reviewed guidance on symptoms, family care, and
          getting the right kind of help at the right time.
        </p>
      </div>

      {isError ? (
        <div className="mt-10 text-sm text-ink/60">
          Could not load articles.{' '}
          <button type="button" onClick={() => refetch()} className="font-medium text-primary">
            Try again
          </button>
        </div>
      ) : !isLoading && posts?.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No articles yet. Check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <BlogCardSkeleton key={i} />
              ))
            : posts?.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="card-raised flex flex-col overflow-hidden"
                >
                  <BlogThumbnail category={post.category} imageUrl={post.cover_image_url} className="h-36" />
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
                      <span>{post.read_time}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      )}
    </div>
  )
}
