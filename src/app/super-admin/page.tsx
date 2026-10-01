import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth-shared";
import {
  getAllOrganizationsOverview,
  getAllProfilesWithOrg,
  getPendingAdminAccounts,
} from "@/lib/data-admin";
import SuperAdminConsole from "@/components/SuperAdminConsole";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) {
    redirect("/dashboard");
  }

  const [organizations, members, pending] = await Promise.all([
    getAllOrganizationsOverview(),
    getAllProfilesWithOrg(),
    getPendingAdminAccounts(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Console Super Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Supervisez toutes les organisations de la plateforme, leurs administrateurs et leurs
          équipes. Cette console n&rsquo;est visible que par vous.
        </p>
      </div>

      <SuperAdminConsole organizations={organizations} members={members} pending={pending} />
    </div>
  );
}
