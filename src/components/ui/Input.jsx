import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    id,
    label,
    icon: Icon,
    error,
    rightElement,
    className = '',
    ...props
  },
  ref
) {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label
          className="ui-field__label"
          htmlFor={id}
        >
          {label}
        </label>
      )}

      <div
        className={[
          'ui-input',
          error ? 'ui-input--error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {Icon && (
          <Icon
            className="ui-input__icon"
            size={20}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        )}

        <input
          ref={ref}
          id={id}
          className="ui-input__control"
          {...props}
        />

        {rightElement && (
          <div className="ui-input__right">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span
          className="ui-field__error"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
})

export default Input