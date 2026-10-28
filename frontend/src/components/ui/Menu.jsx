import { useCallback, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useClickOutside } from '@/hooks/misc'
import { Button } from './Button'

/**
 * <Menu items={[{ label, icon, onClick | to, danger }]} trigger={<custom/>} />
 */
export function Menu({ items, label = 'Plus d’actions', trigger, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  return (
    <div className="menu" ref={ref}>
      {trigger ? (
        <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      ) : (
        <Button variant="ghost" size="sm" iconOnly icon={MoreHorizontal} aria-label={label}
          aria-haspopup="menu" aria-expanded={open} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }} />
      )}
      {open && (
        <div className="menu__list" role="menu" style={align === 'left' ? { left: 0, right: 'auto' } : undefined}>
          {items.filter(Boolean).map(({ label: text, icon: Icon, onClick, to, danger }) => {
            const cls = clsx('menu__item', danger && 'menu__item--danger')
            const content = <>{Icon && <Icon aria-hidden />}{text}</>
            return to ? (
              <Link key={text} to={to} className={cls} role="menuitem" onClick={close}>{content}</Link>
            ) : (
              <button key={text} type="button" className={cls} role="menuitem"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); close(); onClick?.() }}>{content}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
