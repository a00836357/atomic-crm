-- Two-step verification is mandatory: is_admin() also requires the session
-- to be aal2 (password + authenticator code). Every table and storage policy
-- goes through is_admin(), so a password alone no longer reads or writes data.
--
-- Rollback: supabase/rollback/20261113180000_require_aal2.down.sql

create or replace function public.is_admin() returns boolean
    language plpgsql security definer
    set search_path to ''
as $$
begin
  return coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (
      select 1 from public.sales where user_id = auth.uid() and administrator = true
    );
end;
$$;
