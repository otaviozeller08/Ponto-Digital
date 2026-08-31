export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="ui-button__spinner"
          aria-hidden="true"
        />
      )}

      <span className="ui-button__content">
        {children}
      </span>
    </button>
  )
}