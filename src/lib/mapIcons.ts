import L from "leaflet";

// Icônes chargées depuis des CDN publics et gratuits (pas d'asset local à bundler,
// évite les soucis de résolution de chemin de Leaflet avec Webpack/Next.js).
const SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
const COLOR_MARKERS_BASE =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img";

function buildIcon(color: "green" | "grey" | "blue") {
  return new L.Icon({
    iconUrl: `${COLOR_MARKERS_BASE}/marker-icon-2x-${color}.png`,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

export const activeClientIcon = buildIcon("green");
export const blacklistedClientIcon = buildIcon("grey");
export const pickerIcon = buildIcon("blue");

/**
 * Centre de repli lorsqu'aucun client n'est géolocalisé et que la position du
 * navigateur n'est pas disponible. Vue mondiale neutre (n'est plus fixé sur le
 * Sénégal) : la carte se recentre automatiquement dès que des clients ou la
 * position de l'utilisateur sont disponibles.
 */
export const WORLD_CENTER: [number, number] = [20, 10];
export const WORLD_ZOOM = 2;
export const LOCATED_ZOOM = 12;
