-- OptimaxxPlus fields: personal dates and lead origin on contacts, policy
-- details on deals (amount holds the monthly contribution).

alter table public.contacts
    add column city text,
    add column birthday date,
    add column wedding_anniversary date,
    add column lead_source text,
    add column referred_by text;

alter table public.deals
    add column plan_start date,
    add column plan_years smallint,
    add column payment_status text,
    add column month19_contacted boolean not null default false;

-- The new contact columns sit before the computed ones, which create or
-- replace view cannot do, so the view is recreated.
drop view public.contacts_summary;

create view public.contacts_summary with (security_invoker = on) as
select
    co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.sales_id,
    co.linkedin_url,
    co.email_jsonb,
    co.phone_jsonb,
    co.city,
    co.birthday,
    co.wedding_anniversary,
    co.lead_source,
    co.referred_by,
    (jsonb_path_query_array(co.email_jsonb, '$[*]."email"'))::text as email_fts,
    (jsonb_path_query_array(co.phone_jsonb, '$[*]."number"'))::text as phone_fts,
    c.name as company_name,
    count(distinct t.id) filter (where t.done_date is null) as nb_tasks
from public.contacts co
    left join public.tasks t on co.id = t.contact_id
    left join public.companies c on co.company_id = c.id
group by co.id, c.name;

grant all on table public.contacts_summary to anon;
grant all on table public.contacts_summary to authenticated;
grant all on table public.contacts_summary to service_role;
