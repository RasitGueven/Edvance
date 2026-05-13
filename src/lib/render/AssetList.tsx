// Renderer fuer Bilder/Abbildungen einer Aufgabe.
// 1 Asset -> volle Breite. 2+ Assets -> 2-Spalten-Grid (responsive).
// Lazy-Loading + alt-Text Pflicht. Caption optional unter dem Bild.

import type { JSX } from 'react'
import type { TaskAsset } from '@/types'

export function AssetList({
  assets,
  className,
}: {
  assets: TaskAsset[] | null | undefined
  className?: string
}): JSX.Element | null {
  if (!assets || assets.length === 0) return null
  const isGrid = assets.length > 1
  return (
    <div
      className={[
        isGrid ? 'grid gap-3 sm:grid-cols-2' : 'flex justify-center',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {assets.map((a, i) => (
        <figure key={`${a.url}-${i}`} className="m-0 flex flex-col items-center gap-1">
          <img
            src={a.url}
            alt={a.alt}
            loading="lazy"
            className="max-h-72 w-auto max-w-full rounded-md border border-border bg-secondary object-contain"
          />
          {a.caption && (
            <figcaption className="text-center text-xs text-muted-foreground">
              {a.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
