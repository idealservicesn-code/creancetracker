// ============================================================================
// Types partagés — miroir du schéma Supabase (supabase/schema.sql)
// ============================================================================

export type ClientStatus = "active" | "blacklisted";
export type LoanStatus = "ongoing" | "paid" | "overdue";

export interface Client {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string | null;
  cin: string | null;
  address_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ClientStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  organization_id: string;
  client_id: string;
  principal_amount: number;
  total_due_amount: number;
  issue_date: string;
  due_date: string;
  status: LoanStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  loan_id: string;
  amount_paid: number;
  payment_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/** Correspond à la vue SQL public.v_loans_with_balance */
export interface LoanWithBalance {
  id: string;
  client_id: string;
  client_full_name: string;
  client_phone: string | null;
  principal_amount: number;
  total_due_amount: number;
  issue_date: string;
  due_date: string;
  status: LoanStatus;
  total_paid: number;
  balance_due: number;
  is_overdue: boolean;
  is_due_today: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoanWithPayments extends LoanWithBalance {
  payments: Payment[];
}

// ============================================================================
// Multi-tenant : organisations, profils/rôles, invitations
// ============================================================================

export type UserRole = "super_admin" | "admin" | "supervisor";
export type Locale = "fr" | "en" | "ar";

export interface OrgTheme {
  bg_color: string;
  accent_color: string;
  font_family: string;
  font_size: "sm" | "base" | "lg";
}

export interface Organization {
  id: string;
  name: string;
  logo_storage_path: string | null;
  theme: OrgTheme;
  locale: Locale;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionPermission {
  view?: boolean;
  edit?: boolean;
}

export interface SupervisorPermissions {
  clients?: SectionPermission;
  loans?: SectionPermission;
  documents?: SectionPermission;
  dashboard?: SectionPermission;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  role: UserRole;
  full_name: string | null;
  permissions: SupervisorPermissions;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string | null;
  role: UserRole;
  permissions: SupervisorPermissions;
  token: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export type DocumentType = "id_card" | "other";

export interface ClientDocument {
  id: string;
  organization_id: string;
  client_id: string;
  doc_type: DocumentType;
  file_name: string;
  storage_path: string;
  created_by: string | null;
  created_at: string;
}

// Type Database optionnel, fourni à titre indicatif : le client Supabase de ce
// projet n'est volontairement pas paramétré avec ce générique afin de rester
// compatible avec toute version du schéma. Pour un typage strict bout-en-bout,
// générez le vôtre avec `supabase gen types typescript` puis passez-le à
// createBrowserClient<Database>() / createServerClient<Database>().
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Partial<Client> & { full_name: string };
        Update: Partial<Client>;
      };
      loans: {
        Row: Loan;
        Insert: Partial<Loan> & {
          client_id: string;
          principal_amount: number;
          total_due_amount: number;
          due_date: string;
        };
        Update: Partial<Loan>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { loan_id: string; amount_paid: number };
        Update: Partial<Payment>;
      };
    };
    Views: {
      v_loans_with_balance: {
        Row: LoanWithBalance;
      };
    };
  };
}
