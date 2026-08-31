import {
  MapPin,
  Navigation,
} from 'lucide-react'

export default function LocationCard({
  location,
}) {
  return (
    <article className="location-card">
      <div className="location-card__icon">
        <MapPin size={23} />
      </div>

      <div className="location-card__content">
        <div className="location-card__header">
          <strong>
            {location.name}
          </strong>

          <span
            className={
              location.active
                ? 'location-status location-status--active'
                : 'location-status'
            }
          >
            {location.active
              ? 'Ativo'
              : 'Inativo'}
          </span>
        </div>

        {location.address && (
          <p>
            {location.address}
          </p>
        )}

        <div className="location-card__details">
          <span>
            <Navigation
              size={15}
            />

            Raio:
            {' '}
            {location.radius_meters}
            m
          </span>

          <span>
            {Number(
              location.latitude
            ).toFixed(5)}
            ,
            {' '}
            {Number(
              location.longitude
            ).toFixed(5)}
          </span>
        </div>
      </div>
    </article>
  )
}