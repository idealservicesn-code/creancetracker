-- ============================================================================
-- Financial Ledger & Collections Tracker — Schéma Supabase (PostgreSQL)
-- À exécuter intégralement dans l'éditeur SQL de Supabase (SQL Editor > New query)
--
-- IMPORTANT : toutes les tables de ce projet vivent dans un schéma dédié
-- `creances` (et non `public`), pour ne jamais entrer en collision avec
-- d'autres applications qui partageraient ce même compte/projet Supabase
-- (ex: une table `clients` d'un autre projet). Après avoir exécuté ce
-- script, une étape manuelle reste nécessaire dans le Dashboard Supabase :
-- voir la section "ÉTAPE MANUELLE OBLIGATOIRE" tout en bas de ce fichier.
-- ============================================================================

-- Extension nécessaire pour gen_random_uuid() (activée par défaut sur Supabase)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Nettoyage défensif : supprime uniquement les objets que CE script aurait pu
-- créer par erreur dans le schéma `public` lors d'un essai précédent
-- interrompu (aucune table préexistante d'un autre projet n'est touchée : on
-- ne supprime jamais `public.clients`).
-- ----------------------------------------------------------------------------
-- (les triggers associés à public.loans/public.payments, s'ils existaient,
-- sont automatiquement supprimés par le "cascade" ci-dessous — inutile et
-- risqué de les cibler explicitement si la table n'existe pas)
drop view if exists public.v_loans_with_balance;
drop table if exists public.payments cascade;
drop table if exists public.loans cascade;
drop function if exists public.recompute_loan_status() cascade;
drop function if exists public.set_updated_at() cascade;
drop type if exists public.loan_status;
drop type if exists public.client_status;

-- ----------------------------------------------------------------------------
-- Schéma dédié à l'application
-- ----------------------------------------------------------------------------
create schema if not exists creances;

-- ----------------------------------------------------------------------------
-- Types énumérés
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'client_status' and n.nspname = 'creances'
  ) then
    create type creances.client_status as enum ('active', 'blacklisted');
  end if;
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'loan_status' and n.nspname = 'creances'
  ) then
    create type creances.loan_status as enum ('ongoing', 'paid', 'overdue');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table: creances.clients
-- ----------------------------------------------------------------------------
create table if not exists creances.clients (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null check (char_length(trim(full_name)) > 0),
  phone          text,
  cin            text,
  address_notes  text,
  latitude       double precision,
  longitude      double precision,
  status         creances.client_status not null default 'active',
  created_by     uuid references auth.users(id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table creances.clients is 'Portefeuille de clients / débiteurs (Créances Tracker)';

-- ----------------------------------------------------------------------------
-- Table: creances.loans (échéances / prêts)
-- ----------------------------------------------------------------------------
create table if not exists creances.loans (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references creances.clients(id) on delete cascade,
  principal_amount   numeric(12,2) not null check (principal_amount >= 0),
  total_due_amount   numeric(12,2) not null check (total_due_amount >= 0),
  issue_date         date not null default current_date,
  due_date           date not null,
  status             creances.loan_status not null default 'ongoing',
  created_by         uuid references auth.users(id) default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table creances.loans is 'Prêts / créances accordés à un client, avec échéance';

-- ----------------------------------------------------------------------------
-- Table: creances.payments (règlements / encaissements)
-- ----------------------------------------------------------------------------
create table if not exists creances.payments (
  id             uuid primary key default gen_random_uuid(),
  loan_id        uuid not null references creances.loans(id) on delete cascade,
  amount_paid    numeric(12,2) not null check (amount_paid > 0),
  payment_date   date not null default current_date,
  notes          text,
  created_by     uuid references auth.users(id) default auth.uid(),
  created_at     timestamptz not null default now()
);

comment on table creances.payments is 'Règlements partiels ou totaux effectués sur un prêt';

-- ----------------------------------------------------------------------------
-- Index utiles
-- ----------------------------------------------------------------------------
create index if not exists idx_creances_loans_client_id on creances.loans(client_id);
create index if not exists idx_creances_loans_due_date on creances.loans(due_date);
create index if not exists idx_creances_loans_status on creances.loans(status);
create index if not exists idx_creances_payments_loan_id on creances.payments(loan_id);
create index if not exists idx_creances_payments_payment_date on creances.payments(payment_date);
create index if not exists idx_creances_clients_status on creances.clients(status);

-- ----------------------------------------------------------------------------
-- Trigger générique: mise à jour automatique de updated_at
-- ----------------------------------------------------------------------------
create or replace function creances.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on creances.clients;
create trigger trg_clients_updated_at
  before update on creances.clients
  for each row execute function creances.set_updated_at();

drop trigger if exists trg_loans_updated_at on creances.loans;
create trigger trg_loans_updated_at
  before update on creances.loans
  for each row execute function creances.set_updated_at();

-- ----------------------------------------------------------------------------
-- Trigger: recalcul automatique du statut du prêt après chaque paiement
-- (paid si solde <= 0, overdue si échéance dépassée et solde > 0, sinon ongoing)
-- ----------------------------------------------------------------------------
create or replace function creances.recompute_loan_status()
returns trigger
language plpgsql
as $$
declare
  v_loan_id uuid;
  v_total_due numeric(12,2);
  v_due_date date;
  v_total_paid numeric(12,2);
  v_new_status creances.loan_status;
begin
  v_loan_id := coalesce(new.loan_id, old.loan_id);

  select total_due_amount, due_date into v_total_due, v_due_date
  from creances.loans where id = v_loan_id;

  select coalesce(sum(amount_paid), 0) into v_total_paid
  from creances.payments where loan_id = v_loan_id;

  if v_total_paid >= v_total_due then
    v_new_status := 'paid';
  elsif v_due_date < current_date then
    v_new_status := 'overdue';
  else
    v_new_status := 'ongoing';
  end if;

  update creances.loans set status = v_new_status where id = v_loan_id and status is distinct from v_new_status;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_payments_recompute_status on creances.payments;
create trigger trg_payments_recompute_status
  after insert or update or delete on creances.payments
  for each row execute function creances.recompute_loan_status();

-- ----------------------------------------------------------------------------
-- Vue: prêts enrichis avec total payé, solde restant, et statut calculé
-- ----------------------------------------------------------------------------
create or replace view creances.v_loans_with_balance as
select
  l.id,
  l.client_id,
  c.full_name  as client_full_name,
  c.phone      as client_phone,
  l.principal_amount,
  l.total_due_amount,
  l.issue_date,
  l.due_date,
  l.status,
  coalesce(p.total_paid, 0)                              as total_paid,
  l.total_due_amount - coalesce(p.total_paid, 0)          as balance_due,
  (l.due_date < current_date
    and (l.total_due_amount - coalesce(p.total_paid, 0)) > 0) as is_overdue,
  (l.due_date = current_date
    and (l.total_due_amount - coalesce(p.total_paid, 0)) > 0) as is_due_today,
  l.created_at,
  l.updated_at
from creances.loans l
join creances.clients c on c.id = l.client_id
left join (
  select loan_id, sum(amount_paid) as total_paid
  from creances.payments
  group by loan_id
) p on p.loan_id = l.id;

alter view creances.v_loans_with_balance set (security_invoker = on);

-- ----------------------------------------------------------------------------
-- Row Level Security : accès restreint aux seuls utilisateurs authentifiés
-- ----------------------------------------------------------------------------
alter table creances.clients  enable row level security;
alter table creances.loans    enable row level security;
alter table creances.payments enable row level security;

drop policy if exists "Authenticated full access - clients"  on creances.clients;
drop policy if exists "Authenticated full access - loans"     on creances.loans;
drop policy if exists "Authenticated full access - payments"  on creances.payments;

create policy "Authenticated full access - clients"
  on creances.clients for all to authenticated using (true) with check (true);

create policy "Authenticated full access - loans"
  on creances.loans for all to authenticated using (true) with check (true);

create policy "Authenticated full access - payments"
  on creances.payments for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- Droits d'accès (obligatoires en plus de la RLS : Postgres exige un GRANT
-- explicite sur le schéma et les tables pour les rôles utilisés par l'API)
-- ----------------------------------------------------------------------------
grant usage on schema creances to authenticated, service_role;
grant usage on schema creances to anon;

grant all on all tables in schema creances to authenticated, service_role;
grant select on all tables in schema creances to anon;

alter default privileges in schema creances
  grant all on tables to authenticated, service_role;
alter default privileges in schema creances
  grant select on tables to anon;

-- ============================================================================
-- ÉTAPE MANUELLE OBLIGATOIRE (une seule fois, après avoir exécuté ce script) :
--
-- Dashboard Supabase > Project Settings > API > "Exposed schemas"
-- Ajoutez `creances` à la liste (à côté de `public`), puis enregistrez.
--
-- Sans cette étape, l'API Supabase (et donc l'application Next.js) ne pourra
-- pas voir les tables du schéma `creances`, même si le script SQL s'est bien
-- exécuté.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (Optionnel) Compte administrateur de test :
-- Créez l'utilisateur depuis Supabase Studio > Authentication > Add user,
-- ou via l'API Auth. Aucune insertion manuelle dans auth.users n'est requise
-- ni recommandée ici.
-- ----------------------------------------------------------------------------
