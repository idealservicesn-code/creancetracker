import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AssistantWidget from "@/components/AssistantWidget";
import { CurrencyProvider } from "@/lib/currency-context";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileProvisioned, getCurrentOrganization, getCurrentProfile } from "@/lib/auth";
import { getLocale, isRtl } from "@/lib/i18n";
import {
  DEFAULT_ORG_THEME,
  FONT_FAMILY_STACKS,
  FONT_SIZE_PX,
  generateShadeTriplets,
  hexToTriplet,
} from "@/lib/color";

export const metadata: Metadata = {
  title: "Créances Tracker",
  description: "Gestion de portefeuille de créances et suivi d'échéanciers",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = user ? await getCurrentProfile() : null;
  if (user && !profile) {
    // Compte confirmé par email pour la première fois : finalise la création de
    // l'organisation (inscription libre) ou l'acceptation d'invitation en attente.
    profile = await ensureProfileProvisioned();
  }
  const organization = user ? await getCurrentOrganization(profile) : null;

  const theme = { ...DEFAULT_ORG_THEME, ...(organization?.theme ?? {}) };
  const shades = generateShadeTriplets(theme.accent_color);
  const fontStack = FONT_FAMILY_STACKS[theme.font_family] ?? FONT_FAMILY_STACKS.sans;
  const fontSizePx = FONT_SIZE_PX[theme.font_size] ?? FONT_SIZE_PX.base;

  // Le thème n'est appliqué (variables CSS personnalisées) que pour un utilisateur
  // connecté rattaché à une organisation ; les pages publiques (accueil, connexion,
  // inscription) gardent la palette par défaut de la plateforme.
  const themeStyle = organization
    ? `:root{${Object.entries(shades)
        .map(([shade, triplet]) => `--brand-${shade}:${triplet};`)
        .join("")}--org-bg:${hexToTriplet(theme.bg_color)};}
       html{font-size:${fontSizePx}px;}
       body{font-family:${fontStack};background-color:${theme.bg_color};}`
    : null;

  // La langue de l'interface interne (dashboard) reste le français ; seules les
  // pages publiques (accueil, connexion, inscription, invitation) suivent la
  // préférence de langue choisie via le sélecteur (cookie).
  const publicLocale = !user ? getLocale() : "fr";

  return (
    <html lang={publicLocale} dir={!user && isRtl(publicLocale) ? "rtl" : "ltr"}>
      <body className="font-sans">
        {themeStyle ? <style dangerouslySetInnerHTML={{ __html: themeStyle }} /> : null}
        {user ? (
          <CurrencyProvider currency={organization?.currency ?? DEFAULT_CURRENCY}>
            <div className="flex h-screen overflow-hidden">
              <Sidebar organization={organization} profile={profile} />
              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
              </main>
              <AssistantWidget />
            </div>
          </CurrencyProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
