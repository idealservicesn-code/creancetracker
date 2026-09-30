import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase "service role", réservé aux Server Actions du Super Admin.
 *
 * Contrairement à lib/supabase/server.ts (clé publique + cookies de session),
 * ce client utilise la clé secrète service_role : il contourne entièrement la
 * RLS et peut piloter l'API d'administration Auth (création de comptes sans
 * email de confirmation, sans jamais créer ni écraser une session côté
 * navigateur). Ne JAMAIS l'exposer côté client ni le réutiliser pour des
 * requêtes normales — uniquement pour des opérations explicitement admin,
 * déjà gardées par requireSuperAdmin() dans lib/actions-admin.ts.
 *
 * Nécessite la variable d'environnement SUPABASE_SERVICE_ROLE_KEY (sans
 * préfixe NEXT_PUBLIC_, pour qu'elle ne soit jamais embarquée dans le bundle
 * client). Voir .env.local.example.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    db: { schema: "creances" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
