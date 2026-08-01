const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Average delivery speed in km/h (bike/scooter in city)
const AVG_SPEED_KMH = 25;
const ARRIVED_THRESHOLD_KM = 0.5;

export function computeEtaMinutes(distanceKm) {
  if (distanceKm == null) return null;
  return Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
}

export function hasArrived(distanceKm) {
  if (distanceKm == null) return false;
  return distanceKm <= ARRIVED_THRESHOLD_KM;
}
