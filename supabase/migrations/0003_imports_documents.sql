-- Phase 3: merchant categorization rules and the document filing cabinet.

create table category_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  merchant_pattern text not null,
  category_id uuid not null references categories(id),
  created_at timestamptz not null default now(),
  unique (household_id, merchant_pattern)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  folder text not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_path text,
  uploaded_at timestamptz not null default now()
);

create index idx_category_rules_household on category_rules (household_id);
create index idx_documents_household_folder on documents (household_id, folder);

alter table category_rules enable row level security;
alter table documents enable row level security;

create policy "Household members can view category rules"
on category_rules for select using (is_household_member(household_id));
create policy "Household members can manage category rules"
on category_rules for all using (is_household_member(household_id));

create policy "Household members can view documents"
on documents for select using (is_household_member(household_id));
create policy "Household members can manage documents"
on documents for all using (is_household_member(household_id));

-- Private storage bucket for uploaded files. Object paths are prefixed with
-- the household id, and the policies restrict access to that household's
-- members.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Household members can read their documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and is_household_member((split_part(name, '/', 1))::uuid)
);

create policy "Household members can upload their documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and is_household_member((split_part(name, '/', 1))::uuid)
);

create policy "Household members can delete their documents"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and is_household_member((split_part(name, '/', 1))::uuid)
);
