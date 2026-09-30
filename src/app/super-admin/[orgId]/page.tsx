import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/auth-shared";
import {
  getOrgClients,
  getOrgLoans,
  getOrgMembers,
  getOrgPendingInvitations,
  getOrganizationById,
} from "@/lib/data-admin";
import SuperAdminOrgDetail from "@/components/SuperAdminOrgDetail";

export const dynamic = "force-dynamic";

export default async function SuperAdminOrgPage({ params }: { params: { orgId: string } }) {
  const profile = await getCurrentProfile();
  if (!isSuperAdmin(profile)) {
    redirect("/dashboard");
  }

  const organization = await getOrganizationById(params.orgId);
  if (!organization) {
    redirect("/super-admin");
  }

  const [members, invitations, clients, loans] = await Promise.all([
    getOrgMembers(params.orgId),
    getOrgPendingInvitations(params.orgId),
    getOrgClients(params.orgId),
    getOrgLoans(params.orgId),
  ]);

  return (
    <div>
      <SuperAdminOrgDetail
        organization={organization}
        currentProfileId={profile!.id}
        members={members}
        invitations={invitations}
        clients={clients}
        loans={loans}
      />
    </div>
  );
}
