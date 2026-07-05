// Restaurant Location: Central Bengaluru coordinates by default
export const RESTAURANT_LAT = 12.9716;
export const RESTAURANT_LON = 77.5946;
export const ALLOWED_RADIUS_METERS = 50; // 50m radius limit

// Calculates the distance between two sets of latitude/longitude coordinates using the Haversine Formula
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return Number(distance.toFixed(1));
}

// Checks if target coordinates are within the restaurant's allowed zone
export function isWithinRestaurantRadius(lat: number, lon: number): {
  withinRadius: boolean;
  distance: number;
} {
  const distance = getDistanceInMeters(lat, lon, RESTAURANT_LAT, RESTAURANT_LON);
  return {
    withinRadius: distance <= ALLOWED_RADIUS_METERS,
    distance
  };
}
