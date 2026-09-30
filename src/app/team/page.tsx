import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminOrAbove } from "@/lib/auth";
import { getPendingInvitations, getTeamMembers } from "@/lib/data";
import TeamManager from "@/components/TeamManager";

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (!isAdminOrAbove(profile)) {
    redirect("/dashboard");
  }

  const [members, invitations] = await Promise.all([getTeamMembers(), getPendingInvitations()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invitez des superviseurs et configurez précisément ce qu&rsquo;ils peuvent voir et modifier.
        </p>
      </div>

      <TeamManager currentProfileId={profile!.id} initialMembers={members} initialInvitations={invitations} />
    </div>
  );
}
