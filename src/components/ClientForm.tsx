"use client";

import { useRef, useState, useTransition } from "react";
import { MapPin, Loader2, Plus, MessageCircle, LocateFixed, Check } from "lucide-react";
import { createClientRecord } from "@/lib/actions";
import { parseLocationLink } from "@/lib/geo";
import LocationPickerLoader from "./LocationPickerLoader";
import VoiceInputButton from "./VoiceInputButton";

export default function ClientForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function appendDictation(ref: React.RefObject<HTMLInputElement>, text: string) {
    const el = ref.current;
    if (!el) return;
    el.value = el.value ? `${el.value} ${text}` : text;
  }

  const [whatsappLink, setWhatsappLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);
  const [locating, setLocating] = useState(false);

  function handlePick(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
  }

  function handleExtractFromLink() {
    setLinkError(null);
    setLinkOk(false);
    const coords = parseLocationLink(whatsappLink);
    if (!coords) {
      setLinkError("Lien de localisation non reconnu. Collez le lien WhatsApp/Google Maps tel quel.");
      return;
    }
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setLinkOk(true);
    setTimeout(() => setLinkOk(false), 2500);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLinkError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLinkError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLinkError("Impossible d'obtenir votre position (autorisation refusée ?).");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    if (latitude !== null) formData.set("latitude", String(latitude));
    if (longitude !== null) formData.set("longitude", String(longitude));

    startTransition(async () => {
      const result = await createClientRecord(formData);
      if (!result.success) {
        setError(result.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      formRef.current?.reset();
      setLatitude(null);
      setLongitude(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Ajouter un client</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className="label">
            Nom complet *
          </label>
          <div className="flex gap-1.5">
            <input
              ref={fullNameRef}
              id="full_name"
              name="full_name"
              required
              className="input flex-1"
              placeholder="Ex: Awa Ndiaye"
            />
            <VoiceInputButton onResult={(text) => appendDictation(fullNameRef, text)} />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Téléphone
          </label>
          <input id="phone" name="phone" className="input" placeholder="+221 77 000 00 00" />
        </div>

        <div>
          <label htmlFor="cin" className="label">
            CIN
          </label>
          <input id="cin" name="cin" className="input" placeholder="N° carte d'identité" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address_notes" className="label">
            Adresse / repères
          </label>
          <div className="flex gap-1.5">
            <input
              ref={addressRef}
              id="address_notes"
              name="address_notes"
              className="input flex-1"
              placeholder="Quartier, repère, indications d'accès…"
            />
            <VoiceInputButton onResult={(text) => appendDictation(addressRef, text)} />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="label">
            Statut
          </label>
          <select id="status" name="status" defaultValue="active" className="input">
            <option value="active">Actif</option>
            <option value="blacklisted">Liste noire</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label">Latitude</label>
            <input
              type="number"
              step="any"
              className="input"
              value={latitude ?? ""}
              onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
              placeholder="14.6928"
            />
          </div>
          <div className="flex-1">
            <label className="label">Longitude</label>
            <input
              type="number"
              step="any"
              className="input"
              value={longitude ?? ""}
              onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
              placeholder="-17.4467"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="label flex items-center gap-1.5">
          <MessageCircle size={14} /> Coordonnées reçues par WhatsApp
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={whatsappLink}
            onChange={(e) => {
              setWhatsappLink(e.target.value);
              setLinkError(null);
            }}
            className="input flex-1"
            placeholder="Collez ici le lien de localisation partagé par le client sur WhatsApp"
          />
          <button
            type="button"
            onClick={handleExtractFromLink}
            className="btn-secondary shrink-0 whitespace-nowrap !px-3"
          >
            {linkOk ? <Check size={16} className="text-emerald-600" /> : "Extraire"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline disabled:opacity-60"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
          Utiliser ma position actuelle
        </button>
        {linkError && <p className="mt-1.5 text-xs text-red-600">{linkError}</p>}
      </div>

      <div>
        <p className="label flex items-center gap-1.5">
          <MapPin size={14} /> Ou cliquez sur la carte pour localiser le client
        </p>
        <div className="h-56 w-full overflow-hidden rounded-lg border border-gray-300">
          <LocationPickerLoader latitude={latitude} longitude={longitude} onPick={handlePick} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Client ajouté avec succès.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        Ajouter le client
      </button>
    </form>
  );
}
