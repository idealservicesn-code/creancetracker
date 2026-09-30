"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { pickerIcon, WORLD_CENTER, WORLD_ZOOM, LOCATED_ZOOM } from "@/lib/mapIcons";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

/** Recentre la carte sur la position du navigateur au premier affichage, tant qu'aucun point n'a encore été choisi. */
function AutoLocate({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], LOCATED_ZOOM);
      },
      () => {
        // Position refusée : on reste sur la vue par défaut.
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return null;
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onPick }: Props) {
  const hasPoint = latitude !== null && longitude !== null;
  const center: [number, number] = hasPoint ? [latitude, longitude] : WORLD_CENTER;

  return (
    <MapContainer center={center} zoom={hasPoint ? 11 : WORLD_ZOOM} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <AutoLocate enabled={!hasPoint} />
      {hasPoint && <Marker position={[latitude, longitude]} icon={pickerIcon} />}
    </MapContainer>
  );
}
