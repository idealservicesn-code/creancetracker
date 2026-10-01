"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { isPendingAdmin, PENDING_VALIDATION_MESSAGE } from "@/lib/auth-shared";
import { ClientStatus, LoanStatus, Payment } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ----------------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------------
export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "Email et mot de passe requis." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: "Identifiants invalides." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  // Sans redirection explicite, la page protégée en cours (ex: /clients) pouvait
  // rester affichée après déconnexion (sans sidebar, données vides via RLS) au
  // lieu de renvoyer vers /login. redirect() force la navigation immédiatement.
  redirect("/login");
}

// ----------------------------------------------------------------------------
// Clients
// ----------------------------------------------------------------------------
export async function createClientRecord(formData: FormData): Promise<ActionResult> {
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const cin = String(formData.get("cin") || "").trim() || null;
  const address_notes = String(formData.get("address_notes") || "").trim() || null;
  const latRaw = String(formData.get("latitude") || "").trim();
  const lngRaw = String(formData.get("longitude") || "").trim();
  const status = (String(formData.get("status") || "active") as ClientStatus) || "active";

  if (!full_name) {
    return { success: false, error: "Le nom complet est obligatoire." };
  }

  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

  if ((latRaw && Number.isNaN(latitude)) || (lngRaw && Number.isNaN(longitude))) {
    return { success: false, error: "Coordonnées GPS invalides." };
  }

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) {
    return { success: false, error: "Organisation introuvable pour cet utilisateur." };
  }
  if (isPendingAdmin(profile)) {
    return { success: false, error: PENDING_VALIDATION_MESSAGE };
  }

  const supabase = createClient();
  const { error } = await supabase.from("clients").insert({
    organization_id: profile.organization_id,
    full_name,
    phone,
    cin,
    address_notes,
    latitude,
    longitude,
    status,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateClientStatus(
  clientId: string,
  status: ClientStatus
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/clients");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Loans (prêts / échéances)
// ----------------------------------------------------------------------------
/** Taux de majoration automatique appliqué au montant initial pour obtenir le montant total dû. */
const MARKUP_RATE = 1.2;

export async function createLoan(formData: FormData): Promise<ActionResult> {
  const client_id = String(formData.get("client_id") || "");
  const principal_amount = Number(formData.get("principal_amount"));
  const issue_date = String(formData.get("issue_date") || "").trim();
  const due_date = String(formData.get("due_date") || "").trim();

  if (!client_id) return { success: false, error: "Veuillez sélectionner un client." };
  if (!due_date) return { success: false, error: "La date d'échéance est obligatoire." };
  if (Number.isNaN(principal_amount) || principal_amount < 0) {
    return { success: false, error: "Montant initial invalide." };
  }

  // Le montant total dû est toujours calculé côté serveur (montant initial + 20%)
  // pour garantir la cohérence, quelle que soit la valeur envoyée par le formulaire.
  const total_due_amount = Math.round(principal_amount * MARKUP_RATE * 100) / 100;

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) {
    return { success: false, error: "Organisation introuvable pour cet utilisateur." };
  }
  if (isPendingAdmin(profile)) {
    return { success: false, error: PENDING_VALIDATION_MESSAGE };
  }

  const supabase = createClient();
  const { error } = await supabase.from("loans").insert({
    organization_id: profile.organization_id,
    client_id,
    principal_amount,
    total_due_amount,
    issue_date: issue_date || new Date().toISOString().slice(0, 10),
    due_date,
    status: "ongoing" as LoanStatus,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { success: true };
}

// ----------------------------------------------------------------------------
// Payments (règlements)
// ----------------------------------------------------------------------------
export async function recordPayment(formData: FormData): Promise<ActionResult> {
  const loan_id = String(formData.get("loan_id") || "");
  const amount_paid = Number(formData.get("amount_paid"));
  const payment_date = String(formData.get("payment_date") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!loan_id) return { success: false, error: "Prêt introuvable." };
  if (Number.isNaN(amount_paid) || amount_paid <= 0) {
    return { success: false, error: "Montant du règlement invalide." };
  }

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) {
    return { success: false, error: "Organisation introuvable pour cet utilisateur." };
  }
  if (isPendingAdmin(profile)) {
    return { success: false, error: PENDING_VALIDATION_MESSAGE };
  }

  const supabase = createClient();
  const { error } = await supabase.from("payments").insert({
    organization_id: profile.organization_id,
    loan_id,
    amount_paid,
    payment_date: payment_date || new Date().toISOString().slice(0, 10),
    notes,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Récupère l'historique des règlements d'un prêt (appelable depuis un Client Component) */
export async function getPaymentsAction(loanId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("loan_id", loanId)
    .order("payment_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ----------------------------------------------------------------------------
// Pièces jointes clients (CIN, autres documents)
// ----------------------------------------------------------------------------
const DOCUMENTS_BUCKET = "creances-documents";

export async function uploadClientDocument(formData: FormData): Promise<ActionResult> {
  const client_id = String(formData.get("client_id") || "");
  const doc_typeRaw = String(formData.get("doc_type") || "other");
  const doc_type = doc_typeRaw === "id_card" ? "id_card" : "other";
  const file = formData.get("file") as File | null;

  if (!client_id) return { success: false, error: "Client introuvable." };
  if (!file || file.size === 0) {
    return { success: false, error: "Veuillez sélectionner un fichier." };
  }

  const profile = await getCurrentProfile();
  if (!profile?.organization_id) {
    return { success: false, error: "Organisation introuvable pour cet utilisateur." };
  }
  if (isPendingAdmin(profile)) {
    return { success: false, error: PENDING_VALIDATION_MESSAGE };
  }

  const supabase = createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${client_id}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("client_documents").insert({
    organization_id: profile.organization_id,
    client_id,
    doc_type,
    file_name: file.name,
    storage_path: storagePath,
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return { success: false, error: insertError.message };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClientDocument(
  documentId: string,
  storagePath: string
): Promise<ActionResult> {
  const supabase = createClient();

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);

  const { error } = await supabase.from("client_documents").delete().eq("id", documentId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/clients");
  return { success: true };
}

/** Génère une URL signée temporaire pour visualiser/télécharger un document (bucket privé). */
export async function getSignedDocumentUrlAction(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 5);

  if (error || !data) return null;
  return data.signedUrl;
}
