import { cookies } from "next/headers";
import { Locale } from "@/lib/types";
import { LOCALE_COOKIE, LOCALES } from "@/lib/i18n-shared";

export * from "@/lib/i18n-shared";

/** Lit la langue choisie (cookie), avec repli sur le français. Server-only (next/headers). */
export function getLocale(): Locale {
  const stored = cookies().get(LOCALE_COOKIE)?.value;
  if (stored && LOCALES.includes(stored as Locale)) return stored as Locale;
  return "fr";
}
