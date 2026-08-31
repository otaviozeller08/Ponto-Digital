export default function RadiusField({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div className="location-field">
      <label htmlFor="radius">
        Raio permitido
      </label>

      <div className="radius-field">
        <input
          id="radius"
          type="number"
          min="20"
          max="5000"
          step="10"
          value={value}
          disabled={disabled}
          onChange={event =>
            onChange(
              event.target.value
            )
          }
        />

        <span>
          metros
        </span>
      </div>

      <small>
        Funcionários dentro desse
        raio serão considerados no
        local autorizado.
      </small>
    </div>
  )
}