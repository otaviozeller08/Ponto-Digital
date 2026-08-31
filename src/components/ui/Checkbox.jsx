export default function Checkbox({
  id,
  checked,
  onChange,
  label,
  ...props
}) {
  return (
    <label
      className="ui-checkbox"
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
      />

      <span
        className="ui-checkbox__box"
        aria-hidden="true"
      >
        ✓
      </span>

      <span className="ui-checkbox__label">
        {label}
      </span>
    </label>
  )
}