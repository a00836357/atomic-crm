--
-- Row Level Security
-- This file declares RLS policies for all tables.
--

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_notes enable row level security;
alter table public.deals enable row level security;
alter table public.deal_notes enable row level security;
alter table public.sales enable row level security;
alter table public.tags enable row level security;
alter table public.message_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.configuration enable row level security;
alter table public.favicons_excluded_domains enable row level security;

-- Only administrators (public.is_admin()) can read or write CRM data.
create policy "Admins only" on public.companies for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.contact_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.deals for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.deal_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.message_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins only" on public.favicons_excluded_domains for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Sales rows are written by the users edge function (service role) and triggers
create policy "Admins only" on public.sales for select to authenticated using (public.is_admin());

-- Configuration
create policy "Admins only" on public.configuration for select to authenticated using (public.is_admin());
create policy "Enable insert for admins" on public.configuration for insert to authenticated with check (public.is_admin());
create policy "Enable update for admins" on public.configuration for update to authenticated using (public.is_admin()) with check (public.is_admin());
