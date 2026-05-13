// Schlanker Renderer fuer Mathebuch-Aufgaben.
// Akzeptiert Text mit LaTeX:
//   - $...$    inline math
//   - $$...$$  display math (eigene Zeile)
// Alles andere wird als pre-formatter Text gerendert (preserve whitespace).
//
// Bewusst minimal — wenn Mathebuch-Import sich auf Listen/Bilder/Markdown
// stuetzen will, hier erweitern statt eine Markdown-Lib ziehen.

import type { JSX, ReactNode } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html',
    })
  } catch {
    return latex
  }
}

// Findet `$$...$$` und `$...$` Segmente und gibt eine Sequenz aus
// Text-/Math-Stuecken zurueck. Greedy fuer display-math (kommt zuerst).
type Segment = { type: 'text' | 'inline' | 'display'; value: string }

function tokenize(input: string): Segment[] {
  const segments: Segment[] = []
  // $$...$$  ODER  $...$  – $$ zuerst, weil $...$ sonst greedy matched.
  const re = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, m.index) })
    }
    if (m[1] !== undefined) {
      segments.push({ type: 'display', value: m[1] })
    } else if (m[2] !== undefined) {
      segments.push({ type: 'inline', value: m[2] })
    }
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) })
  }
  return segments
}

function renderSegment(seg: Segment, key: number): ReactNode {
  if (seg.type === 'text') {
    return <span key={key}>{seg.value}</span>
  }
  const html = renderMath(seg.value, seg.type === 'display')
  if (seg.type === 'display') {
    return (
      <div
        key={key}
        className="my-3 flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  return (
    <span
      key={key}
      className="mx-0.5 inline-block align-middle"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function MathContent({ text }: { text: string | null | undefined }): JSX.Element {
  if (!text) return <p className="text-sm italic text-muted">– kein Inhalt –</p>
  const segs = tokenize(text)
  return (
    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
      {segs.map((s, i) => renderSegment(s, i))}
    </div>
  )
}
