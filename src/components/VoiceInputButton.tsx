"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  lang?: string;
  className?: string;
}

/**
 * Bouton de dictée vocale (Web Speech API). Se masque silencieusement si le
 * navigateur ne supporte pas la reconnaissance vocale (ex: Firefox) : c'est une
 * "valeur ajoutée", jamais une dépendance bloquante pour remplir un formulaire.
 */
export default function VoiceInputButton({ onResult, lang = "fr-FR", className }: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript) onResult(transcript.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // déjà arrêté
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!supported) return null;

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        // une reconnaissance est déjà en cours
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter la dictée" : "Dicter ce champ à la voix"}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
        listening ? "bg-red-50 text-red-500" : "text-gray-400 hover:bg-gray-100 hover:text-brand-600",
        className
      )}
    >
      {listening ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
    </button>
  );
}
