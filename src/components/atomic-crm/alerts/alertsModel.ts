import {
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  setYear,
  startOfDay,
} from "date-fns";

import type { Contact, Deal } from "../types";

export type AlertType =
  | "birthday"
  | "wedding"
  | "ppr"
  | "month19"
  | "quarterly";

export type CrmAlert = {
  type: AlertType;
  /** ISO date (yyyy-MM-dd) of the event the alert is about */
  date: string;
  /** Days from today to the event, negative when it is past */
  days: number;
  contact?: Contact;
  deal?: Deal;
};

/** How far ahead anniversaries and quarterly reviews are announced */
export const ALERT_WINDOW_DAYS = 30;
/** The month-19 milestone is announced a week ahead... */
const MONTH19_NOTICE_DAYS = 7;
/** ...and stays until marked as done, for at most this many days after */
const MONTH19_GRACE_DAYS = 30;

const toISO = (date: Date) => format(date, "yyyy-MM-dd");

const daysFrom = (today: Date, date: Date) =>
  differenceInCalendarDays(date, today);

/** Next occurrence of a yearly date, today included */
export const nextAnniversary = (dateStr: string, today: Date) => {
  const date = parseISO(dateStr);
  const thisYear = setYear(date, today.getFullYear());
  return daysFrom(today, thisYear) >= 0
    ? thisYear
    : setYear(date, today.getFullYear() + 1);
};

/** Next 3-month mark of a plan, today included; null before the first one */
export const nextQuarterlyReview = (planStart: string, today: Date) => {
  const start = parseISO(planStart);
  for (let months = 3; months <= 12 * 100; months += 3) {
    const date = addMonths(start, months);
    if (daysFrom(today, date) >= 0) return { date, months };
  }
  return null;
};

export const buildAlerts = (
  contacts: Contact[],
  deals: Deal[],
  now: Date = new Date(),
): CrmAlert[] => {
  const today = startOfDay(now);
  const alerts: CrmAlert[] = [];
  const contactsById = new Map(contacts.map((c) => [String(c.id), c]));

  for (const contact of contacts) {
    for (const [type, dateStr] of [
      ["birthday", contact.birthday],
      ["wedding", contact.wedding_anniversary],
    ] as const) {
      if (!dateStr) continue;
      const date = nextAnniversary(dateStr, today);
      const days = daysFrom(today, date);
      if (days <= ALERT_WINDOW_DAYS) {
        alerts.push({ type, date: toISO(date), days, contact });
      }
    }
  }

  for (const deal of deals) {
    if (deal.stage !== "won" || !deal.plan_start || deal.archived_at) continue;
    const contact = deal.contact_ids
      ?.map((id) => contactsById.get(String(id)))
      .find(Boolean);
    const start = parseISO(deal.plan_start);

    const anniversary = nextAnniversary(deal.plan_start, today);
    const anniversaryDays = daysFrom(today, anniversary);
    // the start date itself is not an anniversary
    if (
      anniversary.getFullYear() > start.getFullYear() &&
      anniversaryDays <= ALERT_WINDOW_DAYS
    ) {
      alerts.push({
        type: "ppr",
        date: toISO(anniversary),
        days: anniversaryDays,
        contact,
        deal,
      });
    }

    if (!deal.month19_contacted) {
      const month19 = addMonths(start, 19);
      const days = daysFrom(today, month19);
      if (days >= -MONTH19_GRACE_DAYS && days <= MONTH19_NOTICE_DAYS) {
        alerts.push({
          type: "month19",
          date: toISO(month19),
          days,
          contact,
          deal,
        });
      }
    }

    const quarterly = nextQuarterlyReview(deal.plan_start, today);
    // every 4th review falls on the plan anniversary, already announced
    if (quarterly && quarterly.months % 12 !== 0) {
      const days = daysFrom(today, quarterly.date);
      if (days <= ALERT_WINDOW_DAYS) {
        alerts.push({
          type: "quarterly",
          date: toISO(quarterly.date),
          days,
          contact,
          deal,
        });
      }
    }
  }

  return alerts.sort((a, b) => a.days - b.days);
};

const firstName = (contact?: Contact) =>
  contact?.first_name?.trim().split(/\s+/)[0] ?? "";

/** WhatsApp message for an alert, in the advisor's own words */
export const alertMessage = (alert: CrmAlert) => {
  const name = firstName(alert.contact);
  const hi = name ? `Hola ${name}` : "Hola";
  switch (alert.type) {
    case "birthday":
      return `¡${hi}! 🎂🎉 Quería escribirte en este día tan especial para desearte un muy feliz cumpleaños. Que este nuevo año de vida esté lleno de salud, éxito y momentos maravillosos junto a quienes más quieres. ¡Un abrazo enorme! 🥳`;
    case "wedding":
      return `¡Feliz aniversario${name ? `, ${name}` : ""}! 💍✨ Hoy es un día para celebrar el amor y la vida compartida. Les deseo muchos años más de felicidad, complicidad y grandes momentos juntos. ¡Saludos con mucho cariño! 💕`;
    case "ppr":
      return `${hi}, ¡qué gusto saludarte! 🎯 Hoy se cumple un aniversario más de tu Plan Personal de Retiro. Quiero reconocer tu constancia y tu compromiso con tu futuro financiero — ¡es un logro que vale mucho! ¿Te parece si coordinamos una revisión de tu plan esta semana? Estoy seguro de que tendrás excelentes noticias. 💼😊`;
    case "month19":
      return `${hi}, ¡espero que estés muy bien! Tu plan OptimaxxPlus está por cumplir 19 meses, y a partir de ahora se abren nuevas opciones para sacarle más provecho. ¿Te parece si agendamos una llamada esta semana para platicarlas?`;
    case "quarterly":
      return `${hi}, ¡espero que estés muy bien! Ya pasaron tres meses más desde que arrancaste tu plan, y me gustaría agendar una llamada rápida para revisar cómo va tu ahorro y asegurarnos de que todo sigue alineado a tus metas. ¿Cuándo te viene bien hablar?`;
  }
};

/** Phone number in the international format wa.me expects (Mexico by default) */
export const toWhatsAppNumber = (phone?: string | null) => {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.length === 10 ? `52${digits}` : digits;
};

export const whatsAppLink = (
  alert: CrmAlert,
  message: string = alertMessage(alert),
) => {
  const number = toWhatsAppNumber(alert.contact?.phone_jsonb?.[0]?.number);
  const text = encodeURIComponent(message);
  return number
    ? `https://wa.me/${number}?text=${text}`
    : `https://wa.me/?text=${text}`;
};
