import {
  addMonths,
  differenceInCalendarDays,
  parseISO,
  startOfDay,
} from "date-fns";
import { MessageCircle, Search } from "lucide-react";
import { useGetList, useGetMany, useTranslate } from "ra-core";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  nextAnniversary,
  nextQuarterlyReview,
  toWhatsAppNumber,
} from "../alerts/alertsModel";
import { formatISODateString } from "../deals/dealUtils";
import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contact, Deal } from "../types";

type Client = { contact: Contact; plans: Deal[] };

const ALL = { page: 1, perPage: 1000 };

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Clients are the contacts of active closed (won) deals, one card each. */
export const ClientList = () => {
  const translate = useTranslate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");

  const { data: deals, isPending: dealsPending } = useGetList<Deal>("deals", {
    pagination: ALL,
    sort: { field: "plan_start", order: "ASC" },
    filter: { stage: "won", "archived_at@is": null },
  });
  const contactIds = useMemo(
    () => [...new Set((deals ?? []).flatMap((d) => d.contact_ids ?? []))],
    [deals],
  );
  const { data: contacts, isPending: contactsPending } = useGetMany<Contact>(
    "contacts",
    { ids: contactIds },
    { enabled: contactIds.length > 0 },
  );

  const clients = useMemo(() => {
    const byId = new Map<string, Client>();
    for (const contact of contacts ?? []) {
      byId.set(String(contact.id), { contact, plans: [] });
    }
    for (const deal of deals ?? []) {
      const client = byId.get(String(deal.contact_ids?.[0]));
      client?.plans.push(deal);
    }
    return [...byId.values()]
      .filter((c) => c.plans.length)
      .sort((a, b) =>
        `${a.contact.first_name} ${a.contact.last_name}`.localeCompare(
          `${b.contact.first_name} ${b.contact.last_name}`,
          "es",
        ),
      );
  }, [contacts, deals]);

  const visible = clients.filter(({ contact }) =>
    normalize(`${contact.first_name} ${contact.last_name}`).includes(
      normalize(search),
    ),
  );
  const plans = clients.flatMap((c) => c.plans);
  const totalMonthly = plans.reduce(
    (sum, d) => sum + (d.monthly_contribution ?? 0),
    0,
  );
  const totalValue = plans.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  const isPending = dealsPending || (contactIds.length > 0 && contactsPending);

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate("crm.clients.search")}
            className="pl-8"
          />
        </div>
        {clients.length ? (
          <div className="flex gap-6 text-sm">
            <Stat
              label={translate("crm.clients.count", {
                smart_count: clients.length,
              })}
            />
            <Stat
              label={translate("crm.clients.total_monthly")}
              value={<Money value={totalMonthly} />}
            />
            <Stat
              label={translate("crm.clients.total_value")}
              value={<Money value={totalValue} />}
            />
          </div>
        ) : null}
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          {translate("crm.clients.empty")}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((client) => (
            <ClientCard key={client.contact.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileHeader>
          <h1 className="text-xl font-semibold">
            {translate("crm.clients.title")}
          </h1>
        </MobileHeader>
        <MobileContent>{content}</MobileContent>
      </>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {translate("crm.clients.title")}
      </h1>
      {content}
    </div>
  );
};

ClientList.path = "/clients";

const Stat = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex flex-col items-end">
    {value ? <span className="text-lg font-semibold">{value}</span> : null}
    <span className="text-muted-foreground">{label}</span>
  </div>
);

const Money = ({ value }: { value: number }) => {
  const { currency } = useConfigurationContext();
  return (
    <>
      {value.toLocaleString("es-MX", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      })}
    </>
  );
};

const paymentTone: Record<string, string> = {
  current: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  late: "bg-destructive/10 text-destructive",
  to_verify: "bg-brand-gold/25 text-brand-gold-foreground dark:text-brand-gold",
};

const ClientCard = ({ client: { contact, plans } }: { client: Client }) => {
  const translate = useTranslate();
  const today = startOfDay(new Date());
  const phone = contact.phone_jsonb?.[0]?.number;
  const email = contact.email_jsonb?.[0]?.email;
  const whatsApp = toWhatsAppNumber(phone);

  const upcoming = [
    contact.birthday && {
      label: translate("crm.alerts.types.birthday"),
      date: nextAnniversary(contact.birthday, today),
    },
    contact.wedding_anniversary && {
      label: translate("crm.alerts.types.wedding"),
      date: nextAnniversary(contact.wedding_anniversary, today),
    },
  ].filter(Boolean) as { label: string; date: Date }[];

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/contacts/${contact.id}/show`}
            className="block truncate text-base font-semibold hover:underline"
          >
            {contact.first_name} {contact.last_name}
          </Link>
          <div className="truncate text-sm text-muted-foreground">
            {[phone ?? translate("crm.clients.no_phone"), email]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {whatsApp ? (
          <a
            href={`https://wa.me/${whatsApp}`}
            target="_blank"
            rel="noreferrer"
            aria-label={translate("crm.alerts.whatsapp")}
            className="rounded-md p-1.5 text-primary hover:bg-accent"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        ) : null}
      </div>

      {plans.map((plan) => (
        <PlanDetails key={plan.id} plan={plan} today={today} />
      ))}

      {upcoming.length ? (
        <div className="flex flex-wrap gap-2">
          {upcoming.map(({ label, date }) => (
            <DatePill key={label} label={label} date={date} today={today} />
          ))}
        </div>
      ) : null}
    </Card>
  );
};

const PlanDetails = ({ plan, today }: { plan: Deal; today: Date }) => {
  const translate = useTranslate();
  const quarterly = plan.plan_start
    ? nextQuarterlyReview(plan.plan_start, today)
    : null;
  const anniversary = plan.plan_start
    ? nextAnniversary(plan.plan_start, today)
    : null;
  // same notice period as the month 19 alert
  const month19Due =
    !!plan.plan_start &&
    differenceInCalendarDays(addMonths(parseISO(plan.plan_start), 19), today) <=
      7;

  return (
    <div className="flex flex-col gap-2 rounded-md bg-secondary/60 p-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Field label={translate("resources.deals.fields.monthly_contribution")}>
          {plan.monthly_contribution != null ? (
            <Money value={plan.monthly_contribution} />
          ) : (
            "—"
          )}
        </Field>
        <Field label={translate("resources.deals.fields.amount")}>
          <Money value={plan.amount ?? 0} />
        </Field>
        <Field label={translate("resources.deals.fields.plan_start")}>
          {plan.plan_start ? formatISODateString(plan.plan_start) : "—"}
        </Field>
        <Field label={translate("resources.deals.fields.plan_years")}>
          {plan.plan_years ?? "—"}
        </Field>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {plan.payment_status ? (
          <Badge
            variant="outline"
            className={`border-transparent ${paymentTone[plan.payment_status] ?? ""}`}
          >
            {translate(
              `resources.deals.payment_statuses.${plan.payment_status}`,
            )}
          </Badge>
        ) : null}
        {plan.month19_contacted ? (
          <Badge variant="outline">
            {translate("crm.clients.month19_done")}
          </Badge>
        ) : month19Due ? (
          <Badge
            variant="outline"
            className="border-transparent bg-brand-gold/25 text-brand-gold-foreground dark:text-brand-gold"
          >
            {translate("crm.clients.month19_pending")}
          </Badge>
        ) : null}
        {anniversary &&
        anniversary.getFullYear() > Number(plan.plan_start?.slice(0, 4)) ? (
          <DatePill
            label={translate("crm.alerts.types.ppr")}
            date={anniversary}
            today={today}
          />
        ) : null}
        {quarterly && quarterly.months % 12 !== 0 ? (
          <DatePill
            label={translate("crm.alerts.types.quarterly")}
            date={quarterly.date}
            today={today}
          />
        ) : null}
        <Link
          to={`/deals/${plan.id}/show`}
          className="ml-auto text-sm text-primary hover:underline"
        >
          {translate("crm.clients.view_plan")}
        </Link>
      </div>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="font-medium">{children}</dd>
  </div>
);

const DatePill = ({
  label,
  date,
  today,
}: {
  label: string;
  date: Date;
  today: Date;
}) => {
  const translate = useTranslate();
  const days = differenceInCalendarDays(date, today);
  const tone =
    days <= 7
      ? "bg-brand-gold/25 text-brand-gold-foreground dark:text-brand-gold"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {label}:{" "}
      {days === 0
        ? translate("crm.alerts.today")
        : translate("crm.alerts.in_days", { smart_count: days })}
    </span>
  );
};
