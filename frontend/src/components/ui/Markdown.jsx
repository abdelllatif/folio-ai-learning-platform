import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders generated study text. Citation markers like [2] become clickable chips
 * when ``onCite`` is provided.
 */
export function Markdown({ children, onCite, className = 'reading' }) {
  const text = children || ''
  if (!onCite) {
    return <div className={className}><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div>
  }
  // turn [n] into links with a custom scheme that we intercept
  const linked = text.replace(/\[(\d{1,2})\](?!\()/g, '[[$1]](#cite-$1)')
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children: c }) => {
          const m = href?.match(/^#cite-(\d+)$/)
          if (!m) return <a href={href} target="_blank" rel="noreferrer">{c}</a>
          return (
            <button type="button" className="cite" onClick={() => onCite(Number(m[1]))}
              aria-label={`Voir la source ${m[1]}`}>{m[1]}</button>
          )
        },
      }}>{linked}</ReactMarkdown>
    </div>
  )
}
