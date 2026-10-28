import { forwardRef, useId } from 'react'
import clsx from 'clsx'

export function Field({ label, hint, error, children, id, className }) {
  return (
    <div className={clsx('field', className)}>
      {label && <label className="field__label" htmlFor={id}>{label}</label>}
      {children}
      {error ? <span className="field__error" role="alert">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export const Input = forwardRef(function Input({ label, hint, error, icon: Icon, className, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id || autoId
  const input = (
    <input ref={ref} id={inputId} className={clsx('input', error && 'input--invalid')}
      aria-invalid={Boolean(error)} {...rest} />
  )
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      {Icon ? <div className="input-group"><Icon aria-hidden />{input}</div> : input}
    </Field>
  )
})

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <textarea ref={ref} id={inputId} className={clsx('textarea', error && 'input--invalid')} {...rest} />
    </Field>
  )
})

export const Select = forwardRef(function Select({ label, hint, error, options = [], className, id, placeholder, ...rest }, ref) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <select ref={ref} id={inputId} className={clsx('select', error && 'input--invalid')} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
})

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
