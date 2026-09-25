import { ExternalLink, ImagePlus, Pencil, PlusCircle, Search, Trash2, X } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BlogThumbnail } from '@/components/blog/BlogThumbnail'
import {
  ApiError,
  type BlogPost,
  type BlogPostPayload,
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  uploadBlogImage,
} from '@/lib/api'

const inputClass =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary'

/** Suggestions only; any category can be typed. */
const CATEGORY_SUGGESTIONS = ['Symptom Guide', 'Family Care', 'Wellness', 'Nutrition', 'Mental Health', 'Product']

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

/** Admin list of blog posts: search, write, edit, publish/unpublish, delete. */
export function BlogsSection({
  posts,
  token,
  authorName,
  onChanged,
}: {
  posts: BlogPost[]
  token: string | null
  /** Pre-fills the author on new posts. */
  authorName: string
  /** Reload posts after a change. */
  onChanged: () => Promise<void>
}) {
  // null = form closed, 'new' = writing, otherwise the post being edited.
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return posts
    return posts.filter((p) =>
      [p.title, p.category, p.author, p.excerpt].some((value) => value.toLowerCase().includes(needle)),
    )
  }, [posts, query])

  const published = posts.filter((p) => p.is_published).length

  async function handleDelete(post: BlogPost) {
    if (!token) return
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return
    setError('')
    setBusyId(post.id)
    try {
      await deleteBlogPost(token, post.id)
      if (editing !== 'new' && editing?.id === post.id) setEditing(null)
      await onChanged()
    } catch (err) {
      setError(errorMessage(err, 'Could not delete that post.'))
    } finally {
      setBusyId(null)
    }
  }

  async function togglePublished(post: BlogPost) {
    if (!token) return
    setError('')
    setBusyId(post.id)
    try {
      await updateBlogPost(token, post.id, { is_published: !post.is_published })
      await onChanged()
    } catch (err) {
      setError(errorMessage(err, 'Could not update that post.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Blog posts</h2>
          <p className="mt-0.5 text-xs text-ink/60">
            {published} published · {posts.length - published} draft · shown on the website blog and in the app
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
          className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5"
        >
          <PlusCircle className="h-4 w-4" />
          {editing === 'new' ? 'Cancel' : 'Write a post'}
        </button>
      </div>

      {editing && (
        <BlogForm
          key={editing === 'new' ? 'new' : editing.id}
          post={editing === 'new' ? null : editing}
          token={token}
          authorName={authorName}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await onChanged()
          }}
        />
      )}

      {posts.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, category or author"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {posts.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No posts yet. Write the first one above.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">No posts match "{query}".</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <div key={post.id} className="card-raised flex flex-col overflow-hidden">
              <div className="relative">
                <BlogThumbnail category={post.category} imageUrl={post.cover_image_url} className="h-32" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    post.is_published ? 'bg-success text-white' : 'bg-white text-ink/70'
                  }`}
                >
                  {post.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  {post.category}
                </span>
                <p className="mt-1 text-sm font-semibold text-ink">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink/60">{post.excerpt}</p>
                <p className="mt-2 text-xs text-ink/50">
                  {post.author} · {post.read_time}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(post)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublished(post)}
                    disabled={busyId === post.id}
                    className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
                  >
                    {post.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  {post.is_published && (
                    <Link
                      to={`/blog/${post.slug}`}
                      title="View on site"
                      className="flex items-center rounded-lg border border-ink/15 px-2.5 py-1.5 text-ink hover:bg-ink/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    disabled={busyId === post.id}
                    title="Delete"
                    className="flex items-center rounded-lg border border-danger/20 px-2.5 py-1.5 text-danger hover:bg-danger/5 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/** Write (post = null) or edit form. The cover uploads straight away; its key is saved with the form. */
function BlogForm({
  post,
  token,
  authorName,
  onCancel,
  onSaved,
}: {
  post: BlogPost | null
  token: string | null
  authorName: string
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [category, setCategory] = useState(post?.category ?? '')
  const [author, setAuthor] = useState(post?.author ?? authorName)
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '')
  const [preview, setPreview] = useState(post?.cover_image_url ?? '')
  const [isPublished, setIsPublished] = useState(post?.is_published ?? true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // picking the same file again still fires
    if (!file || !token) return
    setError('')
    setUploading(true)
    try {
      const uploaded = await uploadBlogImage(token, file)
      setCoverImage(uploaded.cover_image)
      setPreview(uploaded.cover_image_url)
    } catch (err) {
      setError(errorMessage(err, 'Could not upload that image.'))
    } finally {
      setUploading(false)
    }
  }

  function validate(): string {
    if (title.trim().length < 3) return 'Enter a title (at least 3 characters).'
    if (category.trim().length < 2) return 'Pick or type a category.'
    if (author.trim().length < 2) return 'Enter the author name.'
    if (excerpt.trim().length < 10) return 'Write a short summary (at least 10 characters).'
    if (content.trim().length < 20) return 'Write the article (at least 20 characters).'
    return ''
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setSaving(true)
    const fields: BlogPostPayload = {
      title: title.trim(),
      category: category.trim(),
      author: author.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      cover_image: coverImage.trim(),
      is_published: isPublished,
    }
    try {
      if (post) {
        // Send only what changed; cover_image "" removes the cover.
        const changes = Object.fromEntries(
          Object.entries(fields).filter(([key, value]) => value !== (post[key as keyof BlogPostPayload] ?? '')),
        )
        if (Object.keys(changes).length > 0) await updateBlogPost(token, post.id, changes)
      } else {
        await createBlogPost(token, { ...fields, cover_image: fields.cover_image || null })
      }
      await onSaved()
    } catch (err) {
      setError(errorMessage(err, post ? 'Could not save your changes.' : 'Could not publish that post.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-raised mt-4 space-y-3 p-5">
      <p className="text-sm font-semibold text-ink">{post ? `Edit "${post.title}"` : 'New blog post'}</p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          <BlogThumbnail category={category} imageUrl={preview} className="h-24" />
          {preview && (
            <button
              type="button"
              onClick={() => {
                setCoverImage('')
                setPreview('')
              }}
              title="Remove cover"
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink hover:bg-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Uploading…' : preview ? 'Replace cover image' : 'Upload cover image'}
          </button>
          <input
            value={coverImage.startsWith('http') ? coverImage : ''}
            onChange={(e) => {
              setCoverImage(e.target.value)
              setPreview(e.target.value)
            }}
            placeholder="…or paste an image link (https://…). Optional."
            className={inputClass}
          />
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={160}
        className={`${inputClass} text-base font-semibold`}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            maxLength={40}
            list="blog-categories"
            className={inputClass}
          />
          <datalist id="blog-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author (e.g. Dr. Ananya Rao)"
          maxLength={80}
          className={inputClass}
        />
      </div>
      <textarea
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Short summary shown on the blog list"
        rows={2}
        maxLength={300}
        className={inputClass}
      />
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'Write the article here.\n\nLeave a blank line between paragraphs.'}
          rows={12}
          className={`${inputClass} leading-6`}
        />
        <p className="mt-1 text-xs text-ink/50">
          Leave a blank line between paragraphs · {content.trim() ? content.trim().split(/\s+/).length : 0} words
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Published (visible on the website and in the app)
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-raised px-4 py-2 text-sm" disabled={saving || uploading}>
          {saving ? 'Saving…' : post ? 'Save changes' : isPublished ? 'Publish post' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
