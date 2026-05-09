// Serlo Video Renderer.
// Erkennt YouTube + Vimeo URLs und rendert als Responsive-Iframe-Embed.
// Andere URLs werden als externer Link angezeigt.

import type { JSX } from 'react'
import { ExternalLink } from 'lucide-react'

const YOUTUBE_NOCOOKIE = 'https://www.youtube-nocookie.com/embed'
const VIMEO_PLAYER = 'https://player.vimeo.com/video'

function extractYouTubeId(url: string): string | null {
  // youtube.com/watch?v=ID  oder  youtu.be/ID  oder  youtube.com/embed/ID
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1).split('/')[0]
      return id || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
    }
  } catch {
    // invalid URL → fall through
  }
  return null
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('vimeo.com')) return null
    const id = u.pathname.split('/').filter(Boolean)[0]
    return id && /^\d+$/.test(id) ? id : null
  } catch {
    return null
  }
}

function getEmbedUrl(url: string): string | null {
  const yt = extractYouTubeId(url)
  if (yt) return `${YOUTUBE_NOCOOKIE}/${yt}`
  const vm = extractVimeoId(url)
  if (vm) return `${VIMEO_PLAYER}/${vm}`
  return null
}

export function SerloVideoRenderer({
  url,
  title,
}: {
  url: string
  title?: string
}): JSX.Element {
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        <ExternalLink className="h-4 w-4" />
        {title ?? 'Video oeffnen'}
      </a>
    )
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 h-full w-full rounded-xl"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={title ?? 'Serlo Video'}
      />
    </div>
  )
}
