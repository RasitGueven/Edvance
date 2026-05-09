// Serlo Edtr-o JSON Renderer.
//
// Serlo speichert Inhalte (Exercise.currentRevision.content,
// Article.currentRevision.content) als JSON-Baum von Editor-Nodes.
// Diese Komponente rendert den Baum nativ als React mit Tailwind-Styles.
//
// Akzeptiert string (wird JSON-geparsed) oder bereits geparstes Objekt.
// Faellt auf <pre> zurueck wenn JSON ungueltig oder leer.

import type { JSX, ReactNode } from 'react'

// Permissiver Node-Type: Edtr-o ist heterogen, manche Felder sind optional.
type EdtrNode = {
  type?: string
  children?: EdtrNode[]
  text?: string
  strong?: boolean
  em?: boolean
  src?: string
  inline?: boolean
  alt?: string
  caption?: string
  title?: string
  level?: number
}

function renderChildren(children: EdtrNode[] | undefined): ReactNode {
  if (!children || children.length === 0) return null
  return children.map((child, i) => <RenderNode key={i} node={child} />)
}

function RenderNode({ node }: { node: EdtrNode }): JSX.Element | null {
  if (!node || typeof node !== 'object') return null
  const type = node.type

  switch (type) {
    case 'root':
    case 'slate':
      return <>{renderChildren(node.children)}</>

    case 'rows':
      return <div className="flex flex-col gap-4">{renderChildren(node.children)}</div>

    case 'p':
      return <p className="mb-3 text-sm leading-relaxed">{renderChildren(node.children)}</p>

    case 'h': {
      const level = node.level ?? 2
      const baseCls = 'font-semibold mb-2 mt-4 text-foreground'
      if (level === 1) return <h2 className={`text-2xl ${baseCls}`}>{renderChildren(node.children)}</h2>
      if (level === 3) return <h4 className={`text-base ${baseCls}`}>{renderChildren(node.children)}</h4>
      return <h3 className={`text-xl ${baseCls}`}>{renderChildren(node.children)}</h3>
    }

    case 'text': {
      const text = node.text ?? ''
      let cls = ''
      if (node.strong) cls += ' font-semibold'
      if (node.em) cls += ' italic'
      const trimmed = cls.trim()
      if (trimmed === '') return <>{text}</>
      return <span className={trimmed}>{text}</span>
    }

    case 'math': {
      const src = node.src ?? ''
      if (node.inline) {
        return (
          <code className="mx-0.5 inline rounded bg-border-strong/40 px-1.5 py-0.5 font-mono text-sm">
            {src}
          </code>
        )
      }
      return (
        <div className="my-3 flex justify-center">
          <code className="rounded bg-border-strong/40 px-4 py-2 font-mono text-sm">{src}</code>
        </div>
      )
    }

    case 'img': {
      const src = node.src ?? ''
      const alt = node.alt ?? ''
      return (
        <figure className="my-3">
          <img src={src} alt={alt} className="max-w-full rounded-lg" loading="lazy" />
          {node.caption && (
            <figcaption className="mt-1 text-xs text-muted">{node.caption}</figcaption>
          )}
        </figure>
      )
    }

    case 'spoiler':
      return (
        <details className="my-3 rounded-lg border-2 border-border bg-card">
          <summary className="cursor-pointer select-none px-4 py-2 text-sm font-semibold">
            {node.title ?? 'Mehr anzeigen'}
          </summary>
          <div className="px-4 pb-3 pt-1">{renderChildren(node.children)}</div>
        </details>
      )

    case 'ul':
      return (
        <ul className="mb-3 list-disc pl-6 text-sm leading-relaxed">
          {renderChildren(node.children)}
        </ul>
      )

    case 'ol':
      return (
        <ol className="mb-3 list-decimal pl-6 text-sm leading-relaxed">
          {renderChildren(node.children)}
        </ol>
      )

    case 'li':
      return <li className="mb-1">{renderChildren(node.children)}</li>

    case 'table':
      return (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>{renderChildren(node.children)}</tbody>
          </table>
        </div>
      )

    case 'tr':
      return <tr className="border-b border-border">{renderChildren(node.children)}</tr>

    case 'th':
      return (
        <th className="border border-border bg-background px-3 py-2 text-left font-semibold">
          {renderChildren(node.children)}
        </th>
      )

    case 'td':
      return (
        <td className="border border-border px-3 py-2">{renderChildren(node.children)}</td>
      )

    default:
      if (type) console.warn('[SerloRenderer] unknown node type:', type, node)
      return <>{renderChildren(node.children)}</>
  }
}

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

  if (parsed == null || typeof parsed !== 'object') {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {String(content)}
      </pre>
    )
  }

  return (
    <div className="serlo-content">
      <RenderNode node={parsed as EdtrNode} />
    </div>
  )
}
