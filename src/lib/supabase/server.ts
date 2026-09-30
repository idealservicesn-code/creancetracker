import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase pour les Server Components / Server Actions / Route Handlers */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Toutes les tables de l'app vivent dans un schéma dédié `creances`
      // (et non `public`) pour ne jamais entrer en collision avec d'autres
      // projets partageant ce même compte Supabase. Voir supabase/schema.sql.
      db: { schema: "creances" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware
            // se charge du rafraîchissement de session.
          }
        },
      },
    }
  );
}
