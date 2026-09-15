import type { Specialty } from '@/data/specialties'

interface SpecialtyThumbnailProps {
  specialty: Specialty
  className?: string
}

export function SpecialtyThumbnail({
  specialty,
  className = 'h-28',
}: SpecialtyThumbnailProps) {
  const { icon: Icon, gradient } = specialty

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
    >
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]"
        aria-hidden
      />
      <Icon className="h-9 w-9 text-white drop-shadow-sm" strokeWidth={1.75} />
    </div>
  )
}
