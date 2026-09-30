/**
 * Extrait des coordonnées GPS à partir d'un lien de localisation partagé
 * depuis WhatsApp (ou Google Maps / Apple Plans, formats proches).
 *
 * Formats reconnus :
 *  - https://maps.google.com/?q=14.6928,-17.4467
 *  - https://www.google.com/maps?q=14.6928,-17.4467
 *  - https://www.google.com/maps/search/?api=1&query=14.6928,-17.4467
 *  - https://www.google.com/maps/@14.6928,-17.4467,15z
 *  - https://maps.apple.com/?ll=14.6928,-17.4467
 *  - Un texte contenant simplement "14.6928, -17.4467"
 */
export function parseLocationLink(
  input: string
): { latitude: number; longitude: number } | null {
  const text = input.trim();
  if (!text) return null;

  const patterns = [
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // ...?q=lat,lng
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // Apple Plans ?ll=lat,lng
    /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/, // ...&query=lat,lng
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // .../@lat,lng,15z
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);
      if (isValidCoordinate(latitude, longitude)) return { latitude, longitude };
    }
  }

  // Dernier recours : un simple couple "lat, lng" collé tel quel
  const bare = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (bare) {
    const latitude = Number(bare[1]);
    const longitude = Number(bare[2]);
    if (isValidCoordinate(latitude, longitude)) return { latitude, longitude };
  }

  return null;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}
