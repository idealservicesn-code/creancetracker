-- ============================================================================
-- Migration : Pièces jointes clients (CIN + autres documents)
-- À exécuter dans Supabase SQL Editor (Dashboard > SQL Editor > New query),
-- APRÈS avoir déjà exécuté schema.sql une première fois.
--
-- Le schéma `creances` est déjà exposé dans l'API (voir schema.sql), donc
-- aucune étape manuelle supplémentaire n'est nécessaire pour la table.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Type énuméré pour le type de document
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'document_type' and n.nspname = 'creances'
  ) then
    create type creances.document_type as enum ('id_card', 'other');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table des pièces jointes
-- ----------------------------------------------------------------------------
create table if not exists creances.client_documents (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references creances.clients(id) on delete cascade,
  doc_type      creances.document_type not null default 'other',
  file_name     text not null,
  storage_path  text not null unique,
  created_by    uuid references auth.users(id) default auth.uid(),
  created_at    timestamptz not null default now()
);

comment on table creances.client_documents is 'Pièces jointes des clients (CIN, autres documents)';

create index if not exists idx_creances_client_documents_client_id
  on creances.client_documents(client_id);

alter table creances.client_documents enable row level security;

drop policy if exists "Authenticated full access - client_documents" on creances.client_documents;
create policy "Authenticated full access - client_documents"
  on creances.client_documents
  for all
  to authenticated
  using (true)
  with check (true);

grant all on creances.client_documents to authenticated, service_role;
grant select on creances.client_documents to anon;

-- ----------------------------------------------------------------------------
-- Bucket de stockage privé pour les fichiers (Supabase Storage)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('creances-documents', 'creances-documents', false)
on conflict (id) do nothing;

drop policy if exists "creances_documents_select" on storage.objects;
drop policy if exists "creances_documents_insert" on storage.objects;
drop policy if exists "creances_documents_delete" on storage.objects;

create policy "creances_documents_select"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'creances-documents');

create policy "creances_documents_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'creances-documents');

create policy "creances_documents_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'creances-documents');

-- ============================================================================
-- Fin de la migration. Aucune étape manuelle supplémentaire n'est requise :
-- le bucket "creances-documents" est créé automatiquement par ce script et
-- reste privé (accès uniquement via les utilisateurs authentifiés de l'app,
-- par URL signée temporaire générée côté serveur).
-- ============================================================================
