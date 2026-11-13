-- Reverts 20261113180000_require_aal2.sql: is_admin() no longer checks aal2.

create or replace function public.is_admin() returns boolean
    language plpgsql security definer
    set search_path to ''
as $$
begin
  return exists (
    select 1 from public.sales where user_id = auth.uid() and administrator = true
  );
end;
$$;
