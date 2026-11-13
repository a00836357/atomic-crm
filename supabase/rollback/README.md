Rollback scripts. They are NOT migrations and are never applied automatically.

To undo a migration, copy its `.down.sql` into `supabase/migrations/` with a
new, later timestamp and run `npx supabase db push --linked`.
