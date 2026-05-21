// Foto-Upload für den Rechenweg. Direktes Kamera-Capture auf Mobile
// (`capture="environment"`), Datei-Picker auf Desktop. Mehrere Fotos pro
// Aufgabe erlaubt — z. B. mehrere Heftseiten.
//
// Persistenz: Bilder gehen sofort in den privaten Storage-Bucket; nur die
// Pfade landen in der Antwort (uploads: string[]). Signed URLs werden erst
// in der Coach-Inbox erzeugt (kurze TTL, kein Leak via JSONB-Backup).

import { useEffect, useRef, useState, type ChangeEvent, type JSX } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import {
  deleteScreeningPhoto,
  getScreeningPhotoSignedUrls,
  uploadScreeningPhoto,
} from '@/lib/supabase/screeningUploads'

type Props = {
  studentId: string | null
  uploads: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export function TaskPhotoSlot({
  studentId,
  uploads,
  onChange,
  disabled,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  // Signed URLs für die aktuellen Pfade nachladen (TTL ~1 h).
  useEffect(() => {
    let cancelled = false
    if (uploads.length === 0) {
      setThumbs({})
      return
    }
    void getScreeningPhotoSignedUrls(uploads).then((urls) => {
      if (!cancelled) setThumbs(urls)
    })
    return () => {
      cancelled = true
    }
  }, [uploads])

  // Ohne Schüler-Row (z. B. Coach im Test-Modus) kein Upload möglich.
  if (!studentId) return <></>

  async function handlePick(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = '' // gleiches File nochmal anwählen können
    if (!file || !studentId) return
    setError(null)
    setBusy(true)
    const { data, error: err } = await uploadScreeningPhoto(studentId, file)
    setBusy(false)
    if (err || !data) {
      setError(err ?? 'Upload fehlgeschlagen')
      return
    }
    onChange([...uploads, data])
  }

  async function handleRemove(path: string): Promise<void> {
    setError(null)
    // Erst aus der lokalen Liste; Storage-Delete best effort (RLS erlaubt
    // Schüler:in eigene Files vor Submit).
    onChange(uploads.filter((p) => p !== path))
    const { error: err } = await deleteScreeningPhoto(path)
    if (err) setError(err)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          className="inline-flex items-center gap-2 self-start rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {uploads.length === 0
            ? 'Rechenweg fotografieren (optional)'
            : 'Weiteres Foto hinzufügen'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/webp"
          capture="environment"
          onChange={(e) => void handlePick(e)}
          className="hidden"
        />
        {uploads.length > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {uploads.length} {uploads.length === 1 ? 'Foto' : 'Fotos'} gespeichert
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-error-gap)]">{error}</p>
      )}

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploads.map((path) => (
            <PhotoThumb
              key={path}
              path={path}
              url={thumbs[path] ?? null}
              onRemove={() => void handleRemove(path)}
              disabled={disabled ?? false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoThumb({
  path,
  url,
  onRemove,
  disabled,
}: {
  path: string
  url: string | null
  onRemove: () => void
  disabled: boolean
}): JSX.Element {
  return (
    <div className="relative">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title={path}>
          <img
            src={url}
            alt="Rechenweg-Foto"
            className="h-24 w-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white object-cover"
          />
        </a>
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Foto verwerfen"
          className="absolute -right-2 -top-2 rounded-full bg-[var(--color-bg-surface)] p-1 text-[var(--color-text-tertiary)] shadow-md hover:text-[var(--color-error-gap)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
