import { redirect } from "next/navigation";
import { getCurrentOrganization, getCurrentProfile, isAdminOrAbove } from "@/lib/auth";
import SettingsManager from "@/components/SettingsManager";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile)) {
    redirect("/dashboard");
  }

  const organization = await getCurrentOrganization(profile);
  if (!organization) {
    redirect("/dashboard");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l&rsquo;organisation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Personnalisez l&rsquo;apparence et les informations de votre organisation.
        </p>
      </div>

      <SettingsManager organization={organization} />
    </div>
  );
}
