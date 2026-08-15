const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Convert a location text to latitude/longitude using Nominatim (OpenStreetMap).
 * @param {string} location - e.g. "Main Street, Shakiso" or "Addis Ababa, Ethiopia"
 * @returns {{ latitude: number, longitude: number } | null}
 */
export async function geocodeLocation(location) {
  if (!location || !location.trim()) return null;

  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Go4DeliveryAdmin/1.0' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.length) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error('[Geocode] Failed:', err.message);
    return null;
  }
}

/**
 * Reverse geocode: lat/lng -> display name
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Go4DeliveryAdmin/1.0' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.display_name || null;
  } catch (err) {
    console.error('[ReverseGeocode] Failed:', err.message);
    return null;
  }
}
