import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui'
import { FAQ } from '@/content/faq'

export function FaqList({ searchable = true }) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQ
    return FAQ.map((g) => ({ ...g, items: g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length)
  }, [query])

  return (
    <div>
      {searchable && (
        <Input icon={Search} type="search" placeholder="Chercher une question…" value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Chercher dans la FAQ" style={{ maxWidth: 420 }} />
      )}
      {groups.length === 0 && <p className="muted" style={{ marginTop: '1.5rem' }}>Aucune question ne correspond. Écrivez-nous depuis la page Contact.</p>}
      {groups.map((g) => (
        <section key={g.group} className="faq-group">
          <h2>{g.group}</h2>
          {g.items.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}<Plus aria-hidden /></summary>
              <div className="faq-item__body">{item.a}</div>
            </details>
          ))}
        </section>
      ))}
    </div>
  )
}
