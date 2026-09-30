"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Locale } from "@/lib/types";
import { LOCALE_COOKIE } from "@/lib/i18n-shared";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "ar", label: "العربية" },
];

export default function LocaleSwitcher({
  current,
  variant = "dark",
}: {
  current: Locale;
  variant?: "dark" | "light";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full p-1 backdrop-blur-sm ring-1",
        variant === "dark" ? "bg-white/10 ring-white/20" : "bg-gray-100 ring-gray-200"
      )}
      aria-label="Langue"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={isPending}
          onClick={() => setLocale(opt.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60",
            current === opt.value
              ? "bg-white text-brand-700 shadow-sm"
              : variant === "dark"
                ? "text-white/80 hover:text-white"
                : "text-gray-500 hover:text-gray-900"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
