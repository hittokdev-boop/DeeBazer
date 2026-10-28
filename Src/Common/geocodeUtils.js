const GOOGLE_MAPS_API_KEY = "AIzaSyA5Jo2sWSApjLojgYNdSgyICND-t3Gzb5M";

/**
 * Validate geographical coordinate values (latitude & longitude)
 */
export const isValidCoordinate = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (lat === '' || lng === '') return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  if (numLat === 0 && numLng === 0) return false;
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return false;
  return true;
};

/**
 * Utility to calculate geographical coordinates (latitude & longitude)
 * from address text inputs (forward geocoding).
 */
export const getCoordinatesFromAddress = async (house, road, land, cit, st, pin) => {
  const attempts = [
    [house, road, land, cit, st, pin, 'India'].filter(Boolean).join(', '),
    [road, land, cit, st, pin, 'India'].filter(Boolean).join(', '),
    [road, cit, st, pin, 'India'].filter(Boolean).join(', '),
    [road, cit, 'India'].filter(Boolean).join(', '),
    [land, cit, 'India'].filter(Boolean).join(', '),
    [pin, cit, 'India'].filter(Boolean).join(', '),
    [pin, 'India'].filter(Boolean).join(', '),
    [cit, st, 'India'].filter(Boolean).join(', '),
    [cit, 'India'].filter(Boolean).join(', '),
  ].filter((v, i, a) => v && v.trim() && a.indexOf(v) === i);

  // 1. Try Google Maps Geocoding first (most accurate)
  for (const q of attempts.slice(0, 3)) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${GOOGLE_MAPS_API_KEY}`
      ).then(r => r.json()).catch(() => null);

      if (gRes && gRes.status === 'OK' && gRes.results && gRes.results[0]?.geometry?.location) {
        const { lat, lng } = gRes.results[0].geometry.location;
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            latitude: Number(lat),
            longitude: Number(lng),
          };
        }
      }
    } catch (gErr) {
      // Continue to next attempt
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim
  for (const q of attempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        {
          headers: { 'User-Agent': 'DeeBazer-App' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data && data[0] && data[0].lat && data[0].lon) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            latitude: lat,
            longitude: lng,
          };
        }
      }
    } catch (e) {
      // Continue to next attempt
    }
  }

  return null;
};
