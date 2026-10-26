import {
  BarChart3,
  Bell,
  Cake,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Target,
  Trophy,
} from "lucide-react";
import { useGetList, useNotify, useTranslate, useUpdate } from "ra-core";
import { useMemo } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  ALERT_TEMPLATE_KEYS,
  fillTemplate,
  firstNameOf,
  type MessageTemplate,
} from "../messages/messagesModel";
import { useMessageTemplates } from "../messages/useMessageTemplates";
import type { Contact, Deal } from "../types";
import {
  alertMessage,
  buildAlerts,
  whatsAppLink,
  type AlertType,
  type CrmAlert,
} from "./alertsModel";

const alertIcons: Record<AlertType, typeof Bell> = {
  birthday: Cake,
  wedding: Heart,
  ppr: Trophy,
  month19: Target,
  quarterly: BarChart3,
};

// A solo advisor's book fits in one page; alerts need every record anyway.
const ALL = { page: 1, perPage: 1000 };

export const AlertsCard = () => {
  const translate = useTranslate();
  const { data: contacts, isPending: contactsPending } = useGetList<Contact>(
    "contacts",
    { pagination: ALL },
  );
  const { data: deals, isPending: dealsPending } = useGetList<Deal>("deals", {
    pagination: ALL,
    filter: { stage: "won", "archived_at@is": null },
  });

  const alerts = useMemo(
    () => buildAlerts(contacts ?? [], deals ?? []),
    [contacts, deals],
  );

  if (contactsPending || dealsPending) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <div className="mr-3 flex">
          <Bell className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.alerts.title")}
        </h2>
        {alerts.length ? (
          <span className="ml-2 rounded-full bg-brand-gold px-2 text-sm font-semibold text-brand-gold-foreground">
            {alerts.length}
          </span>
        ) : null}
      </div>
      <Card className="py-0 gap-0">
        {alerts.length ? (
          <ul className="divide-y">
            {alerts.map((alert) => (
              <AlertItem
                key={`${alert.type}-${alert.deal?.id ?? alert.contact?.id}-${alert.date}`}
                alert={alert}
              />
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {translate("crm.alerts.empty")}
          </p>
        )}
      </Card>
    </div>
  );
};

/** The advisor's template for this alert type, or the built-in message */
const messageFor = (alert: CrmAlert, templates: MessageTemplate[] = []) => {
  const template = templates.find(
    (t) => t.key === ALERT_TEMPLATE_KEYS[alert.type],
  );
  if (!template) return alertMessage(alert);
  const years =
    alert.type === "ppr" && alert.deal?.plan_start
      ? Number(alert.date.slice(0, 4)) -
        Number(alert.deal.plan_start.slice(0, 4))
      : null;
  return fillTemplate(template, {
    firstName: firstNameOf(alert.contact?.first_name),
    years,
  });
};

const AlertItem = ({ alert }: { alert: CrmAlert }) => {
  const { data: templates } = useMessageTemplates();
  const message = messageFor(alert, templates);
  const translate = useTranslate();
  const notify = useNotify();
  const [update, { isPending: isMarking }] = useUpdate<Deal>();
  const Icon = alertIcons[alert.type];
  const name = alert.contact
    ? `${alert.contact.first_name} ${alert.contact.last_name}`
    : (alert.deal?.name ?? translate("crm.alerts.no_contact"));

  const copyMessage = () =>
    navigator.clipboard
      .writeText(message)
      .then(() => notify("crm.common.copied"));

  const markMonth19Done = () => {
    if (!alert.deal) return;
    update(
      "deals",
      {
        id: alert.deal.id,
        data: { month19_contacted: true },
        previousData: alert.deal,
      },
      { onSuccess: () => notify("crm.alerts.marked_done") },
    );
  };

  return (
    <li className="flex flex-col gap-2 p-3">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {translate(`crm.alerts.types.${alert.type}`)}
          </div>
          {alert.contact ? (
            <Link
              to={`/contacts/${alert.contact.id}/show`}
              className="block truncate text-sm text-muted-foreground hover:underline"
            >
              {name}
            </Link>
          ) : (
            <div className="truncate text-sm text-muted-foreground">{name}</div>
          )}
        </div>
        <DaysBadge days={alert.days} />
      </div>
      <div className="flex flex-wrap gap-2 pl-8">
        <Button size="sm" variant="outline" asChild>
          <a
            href={whatsAppLink(alert, message)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            {translate("crm.alerts.whatsapp")}
          </a>
        </Button>
        <Button size="sm" variant="ghost" onClick={copyMessage}>
          <Copy className="h-4 w-4" />
          {translate("crm.alerts.copy_message")}
        </Button>
        {alert.type === "month19" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={markMonth19Done}
            disabled={isMarking}
          >
            <Check className="h-4 w-4" />
            {translate("crm.alerts.mark_done")}
          </Button>
        ) : null}
      </div>
    </li>
  );
};

const DaysBadge = ({ days }: { days: number }) => {
  const translate = useTranslate();
  const label =
    days === 0
      ? translate("crm.alerts.today")
      : days > 0
        ? translate("crm.alerts.in_days", { smart_count: days })
        : translate("crm.alerts.days_ago", { smart_count: -days });
  const tone =
    days < 0
      ? "bg-destructive/10 text-destructive"
      : days <= 3
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
};
