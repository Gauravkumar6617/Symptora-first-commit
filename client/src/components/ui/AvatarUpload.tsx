import { Camera, X } from 'lucide-react'
import { type ChangeEvent, useRef } from 'react'

interface AvatarUploadProps {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
}

export function AvatarUpload({ value, onChange, label = 'Photo' }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <div className="mt-1.5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="icon-badge h-16 w-16 overflow-hidden"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-primary-600" />
          )}
        </button>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            {value ? 'Change photo' : 'Upload photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  )
}
