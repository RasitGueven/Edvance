import { useRef, useState, type JSX } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { uploadTaskAssetFile } from '@/lib/supabase/storage'
import { updateTaskAssets } from '@/lib/supabase/tasks'
import type { Task, TaskAsset } from '@/types'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

function fileBaseName(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(0, idx) : name
}

export function TaskAssetEditor({
  task,
  onUpdated,
}: {
  task: Task
  onUpdated: (updated: Task) => void
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'add' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const assets = task.assets ?? []

  async function handleAdd(file: File): Promise<void> {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Nur Bilddateien sind erlaubt.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`Datei zu gross (max ${Math.floor(MAX_BYTES / 1024 / 1024)} MB).`)
      return
    }
    setBusy('add')
    const up = await uploadTaskAssetFile(task.id, file)
    if (up.error || !up.data) {
      setError(up.error ?? 'Upload fehlgeschlagen')
      setBusy(null)
      return
    }
    const newAsset: TaskAsset = {
      url: up.data.url,
      alt: fileBaseName(file.name),
    }
    const next = [...assets, newAsset]
    const updated = await updateTaskAssets(task.id, next)
    if (updated.error || !updated.data) {
      setError(updated.error ?? 'DB-Update fehlgeschlagen')
      setBusy(null)
      return
    }
    onUpdated(updated.data)
    setBusy(null)
  }

  async function handleRemove(index: number): Promise<void> {
    setError(null)
    setBusy('remove')
    const next = assets.filter((_, i) => i !== index)
    const updated = await updateTaskAssets(task.id, next)
    if (updated.error || !updated.data) {
      setError(updated.error ?? 'Bild konnte nicht entfernt werden')
      setBusy(null)
      return
    }
    onUpdated(updated.data)
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Abbildungen verwalten ({assets.length})
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:border-[var(--primary)] disabled:opacity-60"
        >
          {busy === 'add' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          {busy === 'add' ? 'Lade hoch…' : 'Bild hinzufügen'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleAdd(f)
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      {assets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {assets.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface)] p-2"
            >
              <img
                src={a.url}
                alt={a.alt}
                loading="lazy"
                className="h-12 w-12 flex-none rounded-[var(--radius-sm)] border border-[var(--border)] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {a.alt}
                </p>
                {a.caption && (
                  <p className="truncate text-xs text-[var(--text-muted)]">{a.caption}</p>
                )}
                <p className="truncate font-mono text-xs text-[var(--text-muted)]">{a.url}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(i)}
                disabled={busy !== null}
                title="Bild entfernen"
                aria-label="Bild entfernen"
                className="flex h-7 w-7 flex-none items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-colors hover:bg-[var(--destructive-light)] hover:text-[var(--destructive)] disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  )
}
