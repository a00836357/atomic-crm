-- Deals keep the monthly contribution in its own column; amount becomes the
-- plan value (contribution x 12 x years), kept up to date by a trigger so the
-- board, pipeline totals and charts all show it.

alter table public.deals add column monthly_contribution bigint;

create or replace function public.set_deal_plan_value()
    returns trigger
    language plpgsql
    set search_path to ''
as $$
begin
    if new.monthly_contribution is not null then
        new.amount := new.monthly_contribution * 12 * coalesce(new.plan_years, 0);
    end if;
    return new;
end;
$$;

create or replace trigger set_deal_plan_value_trigger
    before insert or update on public.deals
    for each row execute function public.set_deal_plan_value();

-- Until now amount held the monthly contribution.
update public.deals set monthly_contribution = amount;

-- A contact with an active closed plan is a client, everyone else a prospect.
create or replace view public.contacts_summary with (security_invoker = on) as
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
    count(distinct t.id) filter (where t.done_date is null) as nb_tasks,
    exists (
        select 1 from public.deals d
        where d.stage = 'won' and d.archived_at is null and co.id = any(d.contact_ids)
    ) as is_client
from public.contacts co
    left join public.tasks t on co.id = t.contact_id
    left join public.companies c on co.company_id = c.id
group by co.id, c.name;
