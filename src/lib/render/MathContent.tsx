// Renderer fuer Mathebuch-Aufgaben.
// Markdown (GFM: Tabellen, Listen, Bold, Strike) + LaTeX (inline $...$, display $$...$$).
//
// Pipeline: remark-gfm -> remark-math -> rehype-katex.
// API stabil: <MathContent text={...} />

import type { JSX } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const components: Components = {
  p: ({ node: _n, ...props }) => (
    <p className="my-2 text-sm leading-relaxed text-foreground" {...props} />
  ),
  strong: ({ node: _n, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node: _n, ...props }) => <em className="italic" {...props} />,
  ul: ({ node: _n, ...props }) => (
    <ul className="my-2 ml-6 list-disc space-y-1 text-sm" {...props} />
  ),
  ol: ({ node: _n, ...props }) => (
    <ol className="my-2 ml-6 list-decimal space-y-1 text-sm" {...props} />
  ),
  li: ({ node: _n, ...props }) => <li className="leading-relaxed" {...props} />,
  table: ({ node: _n, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...props} />
    </div>
  ),
  thead: ({ node: _n, ...props }) => <thead className="bg-secondary" {...props} />,
  tr: ({ node: _n, ...props }) => <tr className="border-b border-border" {...props} />,
  th: ({ node: _n, ...props }) => (
    <th className="border border-border px-2 py-1 text-left font-semibold" {...props} />
  ),
  td: ({ node: _n, ...props }) => (
    <td className="border border-border px-2 py-1 align-top" {...props} />
  ),
  code: ({ node: _n, className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? '')
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded bg-secondary p-3 text-xs">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      )
    }
    return (
      <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs" {...props}>
        {children}
      </code>
    )
  },
  a: ({ node: _n, ...props }) => (
    <a className="text-primary underline underline-offset-2 hover:opacity-80" {...props} />
  ),
  hr: ({ node: _n, ...props }) => <hr className="my-4 border-border" {...props} />,
  blockquote: ({ node: _n, ...props }) => (
    <blockquote
      className="my-2 border-l-2 border-border pl-3 italic text-muted-foreground"
      {...props}
    />
  ),
}

export function MathContent({ text }: { text: string | null | undefined }): JSX.Element {
  if (!text) return <p className="text-sm italic text-muted-foreground">– kein Inhalt –</p>
  return (
    <div className="text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
