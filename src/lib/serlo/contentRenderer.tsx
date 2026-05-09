// Serlo Edtr-o JSON Renderer.
//
// Serlo speichert Inhalte als verschachteltes JSON mit zwei Layern:
//
//   1. PLUGIN-Layer (editor wrapper):
//      { plugin: 'text'|'rows'|'article'|'image'|... , state: ... }
//   2. SLATE-Layer (rich text inside text-Plugin):
//      { type: 'p'|'h'|'a'|'math'|..., children: [...] } oder
//      { text: '...', strong?, em? }   (text-leaf, hat keinen type)
//
// Plus ein Top-Level Wrapper:
//      { id, type: 'https://serlo.org/editor', version, document: {plugin, state} }
//
// Math-Nodes werden via KaTeX gerendert. Unbekannte Plugins/Types werden
// best-effort als Fallback gerendert (Kinder/State weiter traversieren).

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

// ── Type-Helfer ──────────────────────────────────────────────────────────────

type EdtrNode = {
  // Slate-Layer
  type?: string
  children?: unknown
  text?: string
  strong?: boolean
  em?: boolean
  code?: boolean
  src?: string
  inline?: boolean
  alt?: string
  caption?: unknown
  title?: unknown
  level?: number
  href?: string
  // Plugin-Wrapper
  plugin?: string
  state?: unknown
  // Plugin-State-Felder (verschiedene plugins)
  introduction?: unknown
  content?: unknown
  exercises?: unknown
  explanation?: unknown
  multimedia?: unknown
  steps?: unknown
  left?: unknown
  right?: unknown
  sign?: unknown
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNode(v: unknown): EdtrNode | null {
  return isObject(v) ? (v as EdtrNode) : null
}

function asNodeArray(v: unknown): EdtrNode[] {
  if (!Array.isArray(v)) return []
  return v.filter(isObject) as EdtrNode[]
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

// ── Slate-Layer Rendering ────────────────────────────────────────────────────

function renderSlateChildren(value: unknown): ReactNode {
  const arr = asNodeArray(value)
  if (arr.length === 0) return null
  return arr.map((child, i) => <RenderNode key={i} node={child} />)
}

function renderSlateNode(node: EdtrNode, key?: number): JSX.Element | null {
  // Text-Leaf: hat 'text' Feld, kein 'type'
  if (typeof node.text === 'string') {
    let cls = ''
    if (node.strong) cls += ' font-semibold'
    if (node.em) cls += ' italic'
    if (node.code) cls += ' font-mono text-[0.95em] bg-border-strong/30 px-1 rounded'
    const trimmed = cls.trim()
    if (trimmed === '') return <>{node.text}</>
    return <span key={key} className={trimmed}>{node.text}</span>
  }

  switch (node.type) {
    case 'p':
      return <p className="mb-3 text-sm leading-relaxed">{renderSlateChildren(node.children)}</p>

    case 'h': {
      const level = node.level ?? 2
      const baseCls = 'font-semibold mb-2 mt-4 text-foreground'
      if (level === 1) return <h2 className={`text-2xl ${baseCls}`}>{renderSlateChildren(node.children)}</h2>
      if (level === 3) return <h4 className={`text-base ${baseCls}`}>{renderSlateChildren(node.children)}</h4>
      return <h3 className={`text-xl ${baseCls}`}>{renderSlateChildren(node.children)}</h3>
    }

    case 'a': {
      const href = node.href ?? '#'
      const isExternal = /^https?:\/\//.test(href)
      return (
        <a
          href={isExternal ? href : `https://de.serlo.org${href}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {renderSlateChildren(node.children)}
        </a>
      )
    }

    case 'math': {
      const src = node.src ?? ''
      if (node.inline) {
        return (
          <span
            className="mx-0.5 inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: renderMath(src, false) }}
          />
        )
      }
      return (
        <div
          className="my-3 flex justify-center overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: renderMath(src, true) }}
        />
      )
    }

    case 'unordered-list':
    case 'ul':
      return <ul className="mb-3 list-disc pl-6 text-sm leading-relaxed">{renderSlateChildren(node.children)}</ul>

    case 'ordered-list':
    case 'ol':
      return <ol className="mb-3 list-decimal pl-6 text-sm leading-relaxed">{renderSlateChildren(node.children)}</ol>

    case 'list-item':
    case 'li': {
      // Serlo umschliesst li-Inhalt manchmal in 'list-item-child' { children }
      return <li className="mb-1">{renderSlateChildren(node.children)}</li>
    }

    case 'list-item-child':
      return <>{renderSlateChildren(node.children)}</>

    default:
      if (node.type) console.warn('[SerloRenderer] unbekannter slate type:', node.type, node)
      return <>{renderSlateChildren(node.children)}</>
  }
}

// ── Plugin-Layer Rendering ───────────────────────────────────────────────────

function renderPlugin(plugin: string, state: unknown): JSX.Element | null {
  switch (plugin) {
    case 'text': {
      // state = array of slate nodes
      const arr = asNodeArray(state)
      if (arr.length === 0) return null
      return <>{arr.map((n, i) => renderSlateNode(n, i))}</>
    }

    case 'rows': {
      // state = array of plugin-wrapped children
      const arr = asNodeArray(state)
      if (arr.length === 0) return null
      return <div className="flex flex-col gap-3">{arr.map((n, i) => <RenderNode key={i} node={n} />)}</div>
    }

    case 'article': {
      const s = asNode(state)
      if (!s) return null
      const intro = asNode(s.introduction)
      const content = asNode(s.content)
      const exercises = asNodeArray(s.exercises)
      return (
        <div className="flex flex-col gap-5">
          {intro && <RenderNode node={intro} />}
          {content && <RenderNode node={content} />}
          {exercises.length > 0 && (
            <details className="rounded-lg border-2 border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-2 text-sm font-semibold">
                Verknuepfte Aufgaben ({exercises.length})
              </summary>
              <div className="px-4 pb-3 pt-1 text-xs text-muted">
                Im Original-Artikel auf Serlo verlinkt.
              </div>
            </details>
          )}
        </div>
      )
    }

    case 'articleIntroduction': {
      const s = asNode(state)
      if (!s) return null
      const explanation = asNode(s.explanation)
      const multimedia = asNode(s.multimedia)
      return (
        <div className="flex flex-col gap-3">
          {explanation && <RenderNode node={explanation} />}
          {multimedia && <RenderNode node={multimedia} />}
        </div>
      )
    }

    case 'image': {
      const s = asNode(state)
      if (!s) return null
      const src = asString(s.src)
      const alt = asString(s.alt) ?? ''
      const caption = asNode(s.caption)
      if (!src) return null
      return (
        <figure className="my-3">
          <img src={src} alt={alt} loading="lazy" className="max-w-full rounded-lg" />
          {caption && (
            <figcaption className="mt-1 text-xs text-muted">
              <RenderNode node={caption} />
            </figcaption>
          )}
        </figure>
      )
    }

    case 'multimedia': {
      const s = asNode(state)
      if (!s) return null
      const explanation = asNode(s.explanation)
      const multimedia = asNode(s.multimedia)
      return (
        <div className="my-3 grid gap-4 sm:grid-cols-2">
          {multimedia && <div><RenderNode node={multimedia} /></div>}
          {explanation && <div><RenderNode node={explanation} /></div>}
        </div>
      )
    }

    case 'spoiler': {
      const s = asNode(state)
      if (!s) return null
      const titleStr = asString(s.title) ?? 'Mehr anzeigen'
      const content = asNode(s.content)
      return (
        <details className="my-3 rounded-lg border-2 border-border bg-card">
          <summary className="cursor-pointer select-none px-4 py-2 text-sm font-semibold">
            {titleStr}
          </summary>
          <div className="px-4 pb-3 pt-1">{content && <RenderNode node={content} />}</div>
        </details>
      )
    }

    case 'box': {
      const s = asNode(state)
      if (!s) return null
      const titleStr = asString(s.title)
      const content = asNode(s.content)
      return (
        <div className="my-3 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
          {titleStr && <p className="mb-1 text-sm font-semibold text-primary">{titleStr}</p>}
          {content && <RenderNode node={content} />}
        </div>
      )
    }

    case 'equations': {
      const s = asNode(state)
      if (!s) return null
      const steps = asNodeArray(s.steps)
      if (steps.length === 0) return null
      const SIGN_TO_LATEX: Record<string, string> = {
        equals: '=',
        'greater-than': '>',
        'less-than': '<',
        'greater-than-or-equal': '\\geq',
        'less-than-or-equal': '\\leq',
        'almost-equal-to': '\\approx',
        'equivalent-to': '\\equiv',
      }
      return (
        <div className="my-3 flex flex-col gap-1">
          {steps.map((step, i) => {
            const left = asString(step.left) ?? ''
            const sign = asString((step as { sign?: unknown }).sign) ?? 'equals'
            const right = asString(step.right) ?? ''
            const latex = `${left} ${SIGN_TO_LATEX[sign] ?? '='} ${right}`
            return (
              <div
                key={i}
                className="flex justify-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: renderMath(latex, true) }}
              />
            )
          })}
        </div>
      )
    }

    case 'exercise': {
      const s = asNode(state)
      if (!s) return null
      const content = asNode(s.content)
      const interactive = asNode((s as { interactive?: unknown }).interactive)
      const solution = asNode((s as { solution?: unknown }).solution)
      return (
        <div className="flex flex-col gap-3">
          {content && <RenderNode node={content} />}
          {interactive && (
            <div className="rounded-lg border-2 border-dashed border-border p-3 text-xs text-muted">
              [Interaktive Aufgabe – Eingabe erfolgt im Edvance-Antwortbereich darunter]
            </div>
          )}
          {solution && (
            <details className="rounded-lg border-2 border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-2 text-sm font-semibold">
                Loesung anzeigen
              </summary>
              <div className="px-4 pb-3 pt-1">
                <RenderNode node={solution} />
              </div>
            </details>
          )}
        </div>
      )
    }

    case 'exerciseGroup': {
      const s = asNode(state)
      if (!s) return null
      const content = asNode(s.content)
      const exercises = asNodeArray((s as { exercises?: unknown }).exercises)
      return (
        <div className="flex flex-col gap-4">
          {content && <RenderNode node={content} />}
          {exercises.map((ex, i) => (
            <div key={i} className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                Teilaufgabe {String.fromCharCode(97 + i)})
              </p>
              <RenderNode node={ex} />
            </div>
          ))}
        </div>
      )
    }

    case 'solution':
    case 'solutionSteps': {
      const s = asNode(state)
      if (!s) return null
      const strategy = asNode((s as { strategy?: unknown }).strategy)
      const steps = asNode((s as { steps?: unknown }).steps)
      const innerStrategy = asNode(strategy?.state)
      const innerSteps = asNode(steps?.state)
      return (
        <div className="flex flex-col gap-3">
          {strategy && <RenderNode node={innerStrategy ?? strategy} />}
          {steps && <RenderNode node={innerSteps ?? steps} />}
        </div>
      )
    }

    case 'injection':
    case 'video':
    case 'highlight':
    case 'serloTable':
    case 'geogebra':
      return (
        <div className="my-3 rounded-lg border-2 border-dashed border-border p-3 text-xs text-muted">
          [Serlo-Plugin <code className="font-mono">{plugin}</code> – nicht nativ unterstuetzt]
        </div>
      )

    default: {
      console.warn('[SerloRenderer] unbekanntes plugin:', plugin, state)
      // Best-effort: state als Array → Kinder rendern.
      if (Array.isArray(state)) {
        return (
          <>{(state as unknown[]).map((n, i) => {
            const node = asNode(n)
            return node ? <RenderNode key={i} node={node} /> : null
          })}</>
        )
      }
      const s = asNode(state)
      if (s?.content) {
        const inner = asNode(s.content)
        if (inner) return <RenderNode node={inner} />
      }
      if (s?.children) return <>{renderSlateChildren(s.children)}</>
      // Letzter Fallback: Hinweis + Plugin-Name (damit man nicht vor leerer Karte steht).
      return (
        <div className="my-2 rounded-lg border-2 border-dashed border-border p-3 text-xs text-muted">
          [Serlo-Plugin <code className="font-mono">{plugin}</code> – keine Anzeige moeglich]
        </div>
      )
    }
  }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

function RenderNode({ node }: { node: EdtrNode }): JSX.Element | null {
  if (!node || typeof node !== 'object') return null

  // Plugin-Wrapper hat Vorrang
  if (typeof node.plugin === 'string') {
    return renderPlugin(node.plugin, node.state)
  }

  // Sonst Slate-Layer
  return renderSlateNode(node)
}

// ── Top-Level Entry ──────────────────────────────────────────────────────────

export function SerloRenderer({
  content,
}: {
  content: string | object | null | undefined
}): JSX.Element {
  if (content == null || content === '') {
    return <p className="text-sm italic text-muted">– kein Inhalt –</p>
  }

  let parsed: unknown
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content)
    } catch {
      return (
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {content}
        </pre>
      )
    }
  } else {
    parsed = content
  }

  if (!isObject(parsed)) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {String(content)}
      </pre>
    )
  }

  // Serlo Editor Wrapper: { id, type: 'https://serlo.org/editor', document: {...} }
  const root = isObject(parsed.document) ? (parsed.document as EdtrNode) : (parsed as EdtrNode)

  return (
    <div className="serlo-content">
      <RenderNode node={root} />
    </div>
  )
}
