"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
      Chargement de la carte…
    </div>
  ),
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPickerLoader(props: Props) {
  return <LocationPicker {...props} />;
}
