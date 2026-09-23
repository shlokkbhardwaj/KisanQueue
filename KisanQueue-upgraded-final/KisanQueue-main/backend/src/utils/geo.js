const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance in km, rounded to 2 decimals. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Number((2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))).toFixed(2));
}

/** Parses ?lat=&lng= . Returns null when absent, { error } when invalid, otherwise { latitude, longitude }. */
export function parseLocation(query) {
  if (query.lat === undefined && query.lng === undefined) return null;
  const latitude = Number(query.lat);
  const longitude = Number(query.lng);
  if (query.lat === undefined || query.lng === undefined
    || query.lat === '' || query.lng === ''
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { error: 'Invalid location parameters.' };
  }
  return { latitude, longitude };
}
