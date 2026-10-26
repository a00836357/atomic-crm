import type { Identifier } from "ra-core";

import type { AlertType } from "../alerts/alertsModel";

export type MessageTemplate = {
  id: Identifier;
  position: number;
  key: string | null;
  title: string;
  blocks: string[];
};

/**
 * The templates of the former InsureCRM, in its order. Its backup only kept
 * the text blocks (by index), so titles and keys come from here.
 */
export const OLD_CRM_TEMPLATES = [
  { key: "first_contact", title: "Primer contacto" },
  { key: "no_reply", title: "Seguimiento sin respuesta" },
  { key: "after_presentation", title: "Después de presentación" },
  { key: "post_presentation", title: "Seguimiento post-presentación" },
  { key: "reconnect", title: "Retomar comunicación" },
  { key: "referrals", title: "Solicitar referidos" },
  { key: "policy_start", title: "Inicio de póliza" },
  { key: "quarterly", title: "Seguimiento trimestral" },
  { key: "month19", title: "Mes 19 — Nuevas opciones disponibles" },
  { key: "ppr", title: "Aniversario del PPR" },
  { key: "birthday", title: "Cumpleaños" },
  { key: "wedding", title: "Aniversario de matrimonio" },
] as const;

/** Template each alert type sends, when it exists */
export const ALERT_TEMPLATE_KEYS: Record<AlertType, string> = {
  birthday: "birthday",
  wedding: "wedding",
  ppr: "ppr",
  month19: "month19",
  quarterly: "quarterly",
};

/** Rows to insert from an InsureCRM backup (insurecrm_messages_v2) */
export const templatesFromBackup = (backup: unknown) => {
  const saved = (backup as Record<string, unknown> | null)
    ?.insurecrm_messages_v2;
  if (!Array.isArray(saved) || saved.length === 0) return null;
  return OLD_CRM_TEMPLATES.map(({ key, title }, position) => ({
    position,
    key,
    title,
    blocks: Array.isArray(saved[position])
      ? (saved[position] as unknown[]).map((block) => String(block ?? ""))
      : [],
  })).filter((template) => template.blocks.some((b) => b.trim()));
};

export const greeting = (now: Date) => {
  const hour = now.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

export type FillContext = {
  firstName?: string | null;
  now?: Date;
  /** replaces [X], e.g. the years of a plan anniversary */
  years?: number | null;
};

/** Replaces [Nombre], [Buenos días / Buenas tardes] and [X] */
export const fillBlock = (
  text: string,
  { firstName, now = new Date(), years }: FillContext = {},
) => {
  let result = text.replace(
    /\[\s*buenos d[ií]as\s*\/\s*buenas tardes\s*\]/gi,
    greeting(now),
  );
  if (firstName) result = result.replace(/\[\s*nombre\s*\]/gi, firstName);
  if (years != null) result = result.replace(/\[\s*x\s*\]/gi, String(years));
  return result;
};

/** The whole template as one WhatsApp message, blocks as paragraphs */
export const fillTemplate = (
  template: Pick<MessageTemplate, "blocks">,
  context: FillContext = {},
) =>
  template.blocks
    .map((block) => fillBlock(block, context).trim())
    .filter(Boolean)
    .join("\n\n");

export const firstNameOf = (name?: string | null) =>
  name?.trim().split(/\s+/)[0] ?? null;
