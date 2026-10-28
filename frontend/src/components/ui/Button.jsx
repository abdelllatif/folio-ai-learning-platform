import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

/**
 * <Button variant="primary|secondary|ghost|danger" size="sm|md|lg" icon={Icon} loading to="/x">
 * Renders a <Link> when ``to`` is given, otherwise a <button>.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size, icon: Icon, iconRight: IconRight, loading, block, to, className,
    children, iconOnly, ...rest },
  ref,
) {
  const cls = clsx('btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block',
    iconOnly && 'btn--icon', className)
  const content = (
    <>
      {loading ? <span className="spinner" style={{ width: 16, height: 16 }} aria-hidden /> : Icon && <Icon aria-hidden />}
      {children}
      {IconRight && !loading && <IconRight aria-hidden />}
    </>
  )
  if (to) return <Link ref={ref} to={to} className={cls} {...rest}>{content}</Link>
  return (
    <button ref={ref} type="button" className={cls} disabled={loading || rest.disabled} {...rest}>
      {content}
    </button>
  )
})
