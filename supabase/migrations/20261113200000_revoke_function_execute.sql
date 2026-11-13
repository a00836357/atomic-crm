-- Security Advisor: SECURITY DEFINER functions callable through /rest/v1/rpc.
--
-- Trigger functions: nobody needs EXECUTE (Postgres does not check it when a
-- trigger fires), so it is revoked from PUBLIC, anon and authenticated.
-- is_admin(): every RLS policy calls it for the signed-in user, so
-- authenticated keeps EXECUTE; PUBLIC and anon lose it.
--
-- Rollback: supabase/rollback/20261113200000_revoke_function_execute.down.sql

revoke execute on function public.cleanup_note_attachments() from public, anon, authenticated;
revoke execute on function public.handle_contact_note_created_or_updated() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_update_user() from public, anon, authenticated;

revoke execute on function public.is_admin() from public, anon;
