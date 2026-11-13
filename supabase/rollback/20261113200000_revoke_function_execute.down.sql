-- Reverts 20261113200000_revoke_function_execute.sql: restores EXECUTE as it
-- was on 2026-11-13 (PUBLIC, anon and authenticated on all five functions).

grant execute on function public.cleanup_note_attachments() to public, anon, authenticated;
grant execute on function public.handle_contact_note_created_or_updated() to public, anon, authenticated;
grant execute on function public.handle_new_user() to public, anon, authenticated;
grant execute on function public.handle_update_user() to public, anon, authenticated;
grant execute on function public.is_admin() to public, anon;
