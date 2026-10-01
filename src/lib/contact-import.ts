// ============================================================================
// Lecture et normalisation des contacts à importer, quelle que soit leur
// source : fichier Excel/CSV, export de contacts (.vcf), ou sélection directe
// depuis les contacts du téléphone (Contact Picker API, Android/Chrome).
// Tout se passe côté navigateur — seules les lignes validées par l'utilisateur
// sont ensuite envoyées au serveur (bulkImportClients).
// ============================================================================
import * as XLSX from "xlsx";

export interface ParsedContact {
  full_name: string;
  phone: string | null;
  cin: string | null;
  address_notes: string | null;
}

const NAME_KEYS = ["nom", "nom complet", "full_name", "fullname", "name", "client", "contact"];
const PHONE_KEYS = ["telephone", "téléphone", "tel", "tél", "phone", "numero", "numéro", "gsm", "mobile"];
const CIN_KEYS = ["cin", "carte d'identite", "carte d'identité", "id", "piece", "pièce"];
const ADDRESS_KEYS = ["adresse", "address", "repere", "repère", "quartier", "notes", "remarques"];

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function matchColumn(headers: string[], keys: string[]): string | null {
  const normalizedKeys = keys.map(normalizeHeader);
  for (const h of headers) {
    if (normalizedKeys.includes(normalizeHeader(h))) return h;
  }
  // Correspondance partielle en secours (ex: "numéro de téléphone principal")
  for (const h of headers) {
    const nh = normalizeHeader(h);
    if (normalizedKeys.some((k) => nh.includes(k))) return h;
  }
  return null;
}

/** Lit un fichier Excel (.xlsx/.xls) ou CSV et tente de mapper les colonnes usuelles. */
export async function parseSpreadsheet(file: File): Promise<ParsedContact[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const nameCol = matchColumn(headers, NAME_KEYS);
  const phoneCol = matchColumn(headers, PHONE_KEYS);
  const cinCol = matchColumn(headers, CIN_KEYS);
  const addressCol = matchColumn(headers, ADDRESS_KEYS);

  return rows
    .map((row) => {
      // Si aucune colonne "nom" identifiée, on prend la première colonne non
      // vide de la ligne comme nom (fichiers exportés sans en-tête standard).
      const full_name = String(nameCol ? row[nameCol] : Object.values(row)[0] ?? "").trim();
      return {
        full_name,
        phone: phoneCol ? String(row[phoneCol] ?? "").trim() || null : null,
        cin: cinCol ? String(row[cinCol] ?? "").trim() || null : null,
        address_notes: addressCol ? String(row[addressCol] ?? "").trim() || null : null,
      };
    })
    .filter((c) => c.full_name.length > 0);
}

/** Lit un export de contacts au format vCard (.vcf), tel que fourni par un téléphone ou Contacts/Outlook sur ordinateur. */
export function parseVCard(text: string): ParsedContact[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  const contacts: ParsedContact[] = [];

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    let full_name = "";
    let phone: string | null = null;
    let address: string | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || /^END:VCARD/i.test(line)) continue;
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).toUpperCase();
      const value = line.slice(colonIndex + 1).trim();

      if (key.startsWith("FN")) {
        full_name = value;
      } else if (!full_name && key.startsWith("N") && !key.startsWith("NOTE")) {
        // N:Nom;Prenom;;; -> reconstruire "Prenom Nom" si FN absent
        const parts = value.split(";").filter(Boolean);
        full_name = parts.reverse().join(" ").trim();
      } else if (key.startsWith("TEL") && !phone) {
        phone = value;
      } else if (key.startsWith("ADR") && !address) {
        address = value.replace(/;+/g, " ").trim();
      }
    }

    if (full_name) {
      contacts.push({ full_name, phone, cin: null, address_notes: address });
    }
  }

  return contacts;
}

/** Détecte le type de fichier et délègue au bon parseur. */
export async function parseContactFile(file: File): Promise<ParsedContact[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".vcf") || name.endsWith(".vcard")) {
    const text = await file.text();
    return parseVCard(text);
  }
  // .xlsx, .xls, .csv
  return parseSpreadsheet(file);
}

// ----------------------------------------------------------------------------
// Contact Picker API : accès direct aux contacts du téléphone, sans fichier
// intermédiaire. Disponible uniquement sur Chrome Android pour le moment —
// on détecte le support et on propose l'import fichier en repli sinon.
// ----------------------------------------------------------------------------
interface ContactPickerContact {
  name?: string[];
  tel?: string[];
  address?: { addressLine?: string[] }[];
}

interface NavigatorWithContacts extends Navigator {
  contacts?: {
    select: (
      properties: string[],
      options?: { multiple?: boolean }
    ) => Promise<ContactPickerContact[]>;
  };
}

export function isContactPickerSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as NavigatorWithContacts).contacts?.select);
}

/** Ouvre le sélecteur de contacts natif du téléphone (nécessite une interaction utilisateur directe). */
export async function pickPhoneContacts(): Promise<ParsedContact[]> {
  const nav = navigator as NavigatorWithContacts;
  if (!nav.contacts?.select) {
    throw new Error("La sélection directe des contacts n'est pas prise en charge sur cet appareil/navigateur.");
  }
  const picked = await nav.contacts.select(["name", "tel", "address"], { multiple: true });
  return picked
    .map((c) => ({
      full_name: (c.name && c.name[0]) || "",
      phone: (c.tel && c.tel[0]) || null,
      cin: null,
      address_notes: (c.address && c.address[0]?.addressLine && c.address[0].addressLine[0]) || null,
    }))
    .filter((c) => c.full_name.trim().length > 0);
}
