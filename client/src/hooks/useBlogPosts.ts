import { useQuery } from '@tanstack/react-query'
import { getBlogPost, listBlogPosts } from '@/lib/api'

/** Published posts. Admin edits invalidate ['blog-posts'] so lists refresh. */
export function useBlogPosts() {
  return useQuery({ queryKey: ['blog-posts'], queryFn: listBlogPosts })
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blog-posts', slug],
    queryFn: () => getBlogPost(slug!),
    enabled: Boolean(slug),
  })
}
