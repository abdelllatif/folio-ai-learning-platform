import { NavLink } from 'react-router-dom'

/** Router-driven tabs: each tab is a link, so tabs are bookmarkable and survive refresh. */
export function RouteTabs({ tabs, label }) {
  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map(({ to, label: text, icon: Icon, end, badge }) => (
        <NavLink key={to} to={to} end={end} className="tab">
          {Icon && <Icon aria-hidden />}{text}
          {badge ? <span className="badge badge--blue" style={{ height: 18 }}>{badge}</span> : null}
        </NavLink>
      ))}
    </nav>
  )
}

/** State-driven tabs. */
export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map(({ value: v, label: text, icon: Icon }) => (
        <button key={v} type="button" role="tab" className="tab" aria-selected={value === v} onClick={() => onChange(v)}>
          {Icon && <Icon aria-hidden />}{text}
        </button>
      ))}
    </div>
  )
}
