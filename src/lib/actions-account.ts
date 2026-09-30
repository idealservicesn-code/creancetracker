"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { ActionResult } from "@/lib/actions";

// ----------------------------------------------------------------------------
// Mon compte : modification du nom complet et du mot de passe de l'utilisateur
// actuellement connecté (jamais création/suppression de compte — cela reste une
// action manuelle de l'utilisateur dans Supabase Studio, cf. règles de sécurité).
// ----------------------------------------------------------------------------
export async function updateOwnProfile(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: "Session introuvable." };

  const full_name = String(formData.get("full_name") || "").trim();
  if (!full_name) return { success: false, error: "Le nom complet est obligatoire." };

  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ full_name }).eq("id", profile.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function changeOwnPassword(formData: FormData): Promise<ActionResult> {
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Tous les champs sont obligatoires." };
  }
  if (newPassword.length < 6) {
    return { success: false, error: "Le nouveau mot de passe doit contenir au moins 6 caractères." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "La confirmation ne correspond pas au nouveau mot de passe." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Session introuvable." };

  // Re-vérifie le mot de passe actuel avant de le changer (bonne pratique de sécurité).
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { success: false, error: "Mot de passe actuel incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };

  return { success: true };
}
