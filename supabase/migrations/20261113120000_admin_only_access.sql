-- Only administrators (public.is_admin(): sales.administrator for auth.uid())
-- may read or write CRM data and attachments. Signed-in non-admin accounts
-- and anonymous visitors get nothing. The attachments bucket becomes private.
--
-- Rollback: supabase/rollback/20261113120000_admin_only_access.down.sql

-- 1. Drop the "any signed-in user" policies
drop policy "Company Delete Policy" on public.companies;
drop policy "Enable insert for authenticated users only" on public.companies;
drop policy "Enable read access for authenticated users" on public.companies;
drop policy "Enable update for authenticated users only" on public.companies;

drop policy "Enable read for authenticated" on public.configuration;

drop policy "Contact Notes Delete Policy" on public.contact_notes;
drop policy "Contact Notes Update policy" on public.contact_notes;
drop policy "Enable insert for authenticated users only" on public.contact_notes;
drop policy "Enable read access for authenticated users" on public.contact_notes;

drop policy "Contact Delete Policy" on public.contacts;
drop policy "Enable insert for authenticated users only" on public.contacts;
drop policy "Enable read access for authenticated users" on public.contacts;
drop policy "Enable update for authenticated users only" on public.contacts;

drop policy "Deal Notes Delete Policy" on public.deal_notes;
drop policy "Deal Notes Update Policy" on public.deal_notes;
drop policy "Enable insert for authenticated users only" on public.deal_notes;
drop policy "Enable read access for authenticated users" on public.deal_notes;

drop policy "Deals Delete Policy" on public.deals;
drop policy "Enable insert for authenticated users only" on public.deals;
drop policy "Enable read access for authenticated users" on public.deals;
drop policy "Enable update for authenticated users only" on public.deals;

drop policy "Enable access for authenticated users only" on public.favicons_excluded_domains;

drop policy "Enable delete for authenticated users only" on public.message_templates;
drop policy "Enable insert for authenticated users only" on public.message_templates;
drop policy "Enable read access for authenticated users" on public.message_templates;
drop policy "Enable update for authenticated users only" on public.message_templates;

drop policy "Enable read access for authenticated users" on public.sales;

drop policy "Enable delete for authenticated users only" on public.tags;
drop policy "Enable insert for authenticated users only" on public.tags;
drop policy "Enable read access for authenticated users" on public.tags;
drop policy "Enable update for authenticated users only" on public.tags;

drop policy "Enable insert for authenticated users only" on public.tasks;
drop policy "Enable read access for authenticated users" on public.tasks;
drop policy "Task Delete Policy" on public.tasks;
drop policy "Task Update Policy" on public.tasks;

drop policy "Attachments 1mt4rzk_0" on storage.objects;
drop policy "Attachments 1mt4rzk_1" on storage.objects;
drop policy "Attachments 1mt4rzk_3" on storage.objects;

-- 2. Administrators only
create policy "Admins only" on public.companies for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.contact_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.deals for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.deal_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.message_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.favicons_excluded_domains for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- sales is written by the users edge function (service role) and triggers
create policy "Admins only" on public.sales for select to authenticated using (public.is_admin());
-- configuration already limits insert/update to admins
create policy "Admins only" on public.configuration for select to authenticated using (public.is_admin());

create policy "Attachments admins only" on storage.objects for all to authenticated
    using (bucket_id = 'attachments' and public.is_admin())
    with check (bucket_id = 'attachments' and public.is_admin());

-- 3. Private bucket: files are only reachable through signed URLs
update storage.buckets set public = false where id = 'attachments';

-- 4. Anonymous visitors only need init_state (the login page asks whether
-- the CRM has been set up). Revoke everything else, including TRUNCATE,
-- which row level security does not cover.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select on table public.init_state to anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
