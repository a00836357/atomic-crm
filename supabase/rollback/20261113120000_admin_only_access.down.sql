-- Reverts 20261113120000_admin_only_access.sql: restores the exact policies,
-- public bucket and anon grants that existed on 2026-11-13.

drop policy "Admins only" on public.companies;
drop policy "Admins only" on public.contacts;
drop policy "Admins only" on public.contact_notes;
drop policy "Admins only" on public.deals;
drop policy "Admins only" on public.deal_notes;
drop policy "Admins only" on public.tags;
drop policy "Admins only" on public.tasks;
drop policy "Admins only" on public.message_templates;
drop policy "Admins only" on public.favicons_excluded_domains;
drop policy "Admins only" on public.sales;
drop policy "Admins only" on public.configuration;
drop policy "Attachments admins only" on storage.objects;

create policy "Company Delete Policy" on public.companies for delete to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.companies for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.companies for select to authenticated using (true);
create policy "Enable update for authenticated users only" on public.companies for update to authenticated using (true) with check (true);

create policy "Enable read for authenticated" on public.configuration for select to authenticated using (true);

create policy "Contact Notes Delete Policy" on public.contact_notes for delete to authenticated using (true);
create policy "Contact Notes Update policy" on public.contact_notes for update to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.contact_notes for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.contact_notes for select to authenticated using (true);

create policy "Contact Delete Policy" on public.contacts for delete to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.contacts for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.contacts for select to authenticated using (true);
create policy "Enable update for authenticated users only" on public.contacts for update to authenticated using (true) with check (true);

create policy "Deal Notes Delete Policy" on public.deal_notes for delete to authenticated using (true);
create policy "Deal Notes Update Policy" on public.deal_notes for update to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.deal_notes for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.deal_notes for select to authenticated using (true);

create policy "Deals Delete Policy" on public.deals for delete to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.deals for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.deals for select to authenticated using (true);
create policy "Enable update for authenticated users only" on public.deals for update to authenticated using (true) with check (true);

create policy "Enable access for authenticated users only" on public.favicons_excluded_domains for all to authenticated using (true) with check (true);

create policy "Enable delete for authenticated users only" on public.message_templates for delete to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.message_templates for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.message_templates for select to authenticated using (true);
create policy "Enable update for authenticated users only" on public.message_templates for update to authenticated using (true) with check (true);

create policy "Enable read access for authenticated users" on public.sales for select to authenticated using (true);

create policy "Enable delete for authenticated users only" on public.tags for delete to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.tags for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.tags for select to authenticated using (true);
create policy "Enable update for authenticated users only" on public.tags for update to authenticated using (true);

create policy "Enable insert for authenticated users only" on public.tasks for insert to authenticated with check (true);
create policy "Enable read access for authenticated users" on public.tasks for select to authenticated using (true);
create policy "Task Delete Policy" on public.tasks for delete to authenticated using (true);
create policy "Task Update Policy" on public.tasks for update to authenticated using (true);

create policy "Attachments 1mt4rzk_0" on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy "Attachments 1mt4rzk_1" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "Attachments 1mt4rzk_3" on storage.objects for delete to authenticated using (bucket_id = 'attachments');

update storage.buckets set public = true where id = 'attachments';

grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;
alter default privileges in schema public grant all on tables to anon;
alter default privileges in schema public grant all on sequences to anon;
