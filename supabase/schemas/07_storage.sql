--
-- Storage
-- This file declares storage bucket policies.
--

-- The attachments bucket is private (served through signed URLs) and only
-- administrators can use it.
create policy "Attachments admins only" on storage.objects for all to authenticated
    using (bucket_id = 'attachments' and public.is_admin())
    with check (bucket_id = 'attachments' and public.is_admin());
