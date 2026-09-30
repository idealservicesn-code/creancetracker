import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization, getCurrentProfile } from "@/lib/auth";
import AccountManager from "@/components/AccountManager";

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const organization = await getCurrentOrganization(profile);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos informations personnelles et votre mot de passe.
        </p>
      </div>

      <AccountManager
        profile={profile}
        email={user?.email ?? ""}
        organizationName={organization?.name ?? null}
      />
    </div>
  );
}
