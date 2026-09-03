const OSRM_BASE = 'http://router.project-osrm.org';

export async function getRouteDirections(fromLat, fromLng, toLat, toLng) {
  if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;

  try {
    const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.routes || !data.routes.length) return null;

    const route = data.routes[0];
    const step = route.legs[0];

    return {
      distance_km: parseFloat((route.distance / 1000).toFixed(2)),
      duration_minutes: Math.max(1, Math.round(route.duration / 60)),
      geometry: route.geometry,
      steps: step.steps.map(s => ({
        instruction: s.maneuver.type === 'depart'
          ? 'Head out'
          : s.maneuver.type === 'arrive'
            ? 'Arrive at destination'
            : `${s.maneuver.modifier || ''} on ${s.name || 'road'}`.trim(),
        distance_km: parseFloat((s.distance / 1000).toFixed(2)),
        duration_minutes: Math.max(1, Math.round(s.duration / 60)),
        maneuver: s.maneuver.type,
      })),
    };
  } catch (err) {
    console.error('[OSRM] Route fetch failed:', err.message);
    return null;
  }
}
