import { useState } from 'react'
import { getCategoryTheme } from '@/lib/blogTheme'

interface BlogThumbnailProps {
  category: string
  /** Uploaded cover; falls back to the category artwork. */
  imageUrl?: string | null
  className?: string
}

export function BlogThumbnail({ category, imageUrl, className = 'h-36' }: BlogThumbnailProps) {
  const { icon: Icon, gradient } = getCategoryTheme(category)
  const [broken, setBroken] = useState(false)

  if (imageUrl && !broken) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setBroken(true)}
        className={`w-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />
      <Icon className="h-10 w-10 text-white/90" strokeWidth={1.75} />
    </div>
  )
}
