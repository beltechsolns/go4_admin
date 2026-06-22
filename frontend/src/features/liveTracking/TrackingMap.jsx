import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import useTracking from '../../hooks/useTracking'

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom icon factory
const makeIcon = (color, emoji) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;color:white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2px solid white;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

const riderIcon = makeIcon('#F25C22', '🛵')

// Shakiso, Ethiopia center
const CENTER = [5.7926, 38.9821]

export default function TrackingMap() {
  const { data: riders, loading } = useTracking()

  const hasLocations = riders.some(r => r.location?.lat && r.location?.lng)

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-[#E0E5F2] shadow-sm xl:col-span-2">

      {/* Legend overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-md text-xs font-semibold">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F25C22]" />Riders</span>
      </div>

      {/* Rider count badge */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-white px-3 py-2 shadow-md text-xs font-semibold text-[#1B2559]">
        <p className="text-[#A3AED0] text-[10px] mb-0.5">Active Riders</p>
        <span className="flex items-center gap-1.5 text-[#05CD99]">
          {loading ? '...' : `${riders.length} online`}
        </span>
      </div>

      <MapContainer
        center={CENTER}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!loading && hasLocations && riders.map((rider) => {
          const pos = [rider.location.lat, rider.location.lng]
          return (
            <Marker key={rider.id} position={pos} icon={riderIcon}>
              <Popup>
                <div className="text-sm font-semibold">{rider.full_name}</div>
                {rider.current_order && (
                  <div className="text-xs text-gray-500 mt-1">
                    {rider.current_order.order_number} — {rider.current_order.customer_name}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#F25C22]">⭐ {rider.rating}</span>
                  <span className="text-[#A3AED0]">{rider.vehicle_type}</span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${
                    rider.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>{rider.status}</span>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {!loading && !hasLocations && (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-xl bg-white px-4 py-2 text-sm text-[#A3AED0] shadow-md">
              No rider location data available
            </p>
          </div>
        )}
      </MapContainer>
    </div>
  )
}
