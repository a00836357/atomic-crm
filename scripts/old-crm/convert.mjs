// Converts a backup of the former single-file InsureCRM (its localStorage
// keys) into Atomic CRM records. Pure functions only: see import.mjs for the
// part that talks to Supabase.

export const IMPORT_TAG = "CRM anterior";
export const BANK_TAG = "Banco de prospectos";

const STAGES = {
  initial: "opportunity",
  appointment: "appointment",
  proposal: "proposal-sent",
  closed: "won",
  not_interested: "lost",
};

const TEMPERATURES = {
  Cold: "cold",
  Warm: "warm",
  Hot: "hot",
  Frío: "cold",
  Tibio: "warm",
  Caliente: "hot",
};

const PAYMENT_STATUSES = {
  corriente: "current",
  atrasado: "late",
  pendiente: "to_verify",
};

const LEAD_SOURCES = {
  Referido: "referral",
  "Red social": "social",
  Evento: "event",
  Orgánico: "organic",
  Otro: "other",
};

const NEXT_CONTACT_LABELS = {
  1: "Primer contacto",
  2: "Seguimiento sin respuesta",
  3: "Después de presentación",
  4: "Seguimiento post-presentación",
  5: "Retomar comunicación",
};

// Records the old CRM inserted on its own whenever a list was empty.
const SAMPLE_RECORDS = [
  ["Carlos Mendoza", "33 1234 5678"],
  ["Laura Sánchez", "55 9876 5432"],
  ["Roberto Jiménez", "81 5555 1234"],
  ["Ana Torres", "22 3456 7890"],
  ["Fernando Díaz", "47 4567 8901"],
  ["Miguel Herrera", "44 2345 6789"],
  ["Sofía Ramírez", "66 7891 2345"],
  ["Patricia Vega", "33 8765 4321"],
  ["Javier Morales", "55 2345 6789"],
  ["Daniela Ruiz", "81 9988 7766"],
];

const digits = (phone) => (phone ?? "").toString().replace(/\D/g, "");

const normalizeName = (name) =>
  (name ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const isSampleRecord = (name, phone) =>
  SAMPLE_RECORDS.some(
    ([sampleName, samplePhone]) =>
      normalizeName(sampleName) === normalizeName(name) &&
      digits(samplePhone) === digits(phone),
  );

/** "Ana María López" -> Ana / María López: the first word is the first name */
export const splitName = (fullName) => {
  const words = (fullName ?? "").toString().trim().split(/\s+/).filter(Boolean);
  return {
    first_name: words[0] ?? "Sin nombre",
    last_name: words.slice(1).join(" "),
  };
};

// Days between Excel's day 0 and the Unix epoch (Excel counts 1900 as a leap year)
const EXCEL_EPOCH_OFFSET = 25569;

/** yyyy-MM-dd from an ISO string or an Excel serial day ("45674"), else null */
export const isoDate = (value) => {
  const s = (value ?? "").toString().trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // the prospect bank kept the raw cells of the spreadsheet it was imported from
  if (/^\d{5}$/.test(s)) {
    const ms = (Number(s) - EXCEL_EPOCH_OFFSET) * 86400000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  return null;
};

const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "los", "y"]);

/** "PEDRO GRACÍA DE LEÓN" -> "Pedro Gracía de León"; mixed case is kept */
export const fixCapitals = (name) => {
  const s = (name ?? "").toString().trim().replace(/\s+/g, " ");
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((word, i) =>
      i > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
};

const text = (value) => {
  const s = (value ?? "").toString().trim();
  return s || null;
};

const contactKey = (name, phone) =>
  digits(phone)
    ? `phone:${digits(phone).slice(-10)}`
    : `name:${normalizeName(name)}`;

/**
 * @param {object} backup the JSON exported from the old CRM
 * @param {string} today yyyy-MM-dd, used where Atomic requires a date
 * @returns {{ contacts: object[], skipped: object[] }} each contact carries
 *   its own `deals`, `notes` and `tasks` to create once it has an id
 */
export const convertBackup = (backup, today) => {
  const pipeline = backup.insurecrm_v1 ?? [];
  const clients = backup.insurecrm_clients_v1 ?? [];
  const bank = backup.insurecrm_bank_v1 ?? [];

  const contacts = new Map();
  const skipped = [];

  const contactFor = (name, phone, createdAt) => {
    const key = contactKey(name, phone);
    let contact = contacts.get(key);
    if (!contact) {
      const seen = createdAt ?? `${today}T12:00:00.000Z`;
      contact = {
        ...splitName(fixCapitals(name)),
        phone_jsonb: digits(phone)
          ? [{ number: phone.trim(), type: "Work" }]
          : [],
        email_jsonb: [],
        first_seen: seen,
        last_seen: seen,
        status: null,
        tags: [IMPORT_TAG],
        deals: [],
        notes: [],
        tasks: [],
      };
      contacts.set(key, contact);
    }
    return contact;
  };

  const keep = (source, record) => {
    if (!text(record.name)) {
      skipped.push({ source, reason: "sin nombre", record });
      return false;
    }
    if (isSampleRecord(record.name, record.phone)) {
      skipped.push({ source, reason: "dato de ejemplo", record });
      return false;
    }
    return true;
  };

  for (const p of pipeline) {
    if (!keep("pipeline", p)) continue;
    const contact = contactFor(p.name, p.phone, p.createdAt);
    contact.city ??= text(p.city);
    contact.status = TEMPERATURES[p.temp] ?? contact.status;
    const stage = STAGES[p.stage] ?? "opportunity";
    contact.deals.push({
      name: `OptimaxxPlus · ${p.name.trim()}`,
      stage,
      categories: ["optimaxx-plus"],
      monthly_contribution: Math.round(p.contribution || 0),
      plan_years: p.term ? Math.round(p.term) : null,
      expected_closing_date: isoDate(p.date) ?? today,
      created_at: p.createdAt ?? undefined,
    });
    if (text(p.notes)) {
      contact.notes.push({ text: p.notes.trim(), date: p.createdAt });
    }
    if (isoDate(p.date) && stage !== "won" && stage !== "lost") {
      contact.tasks.push({
        type: "follow-up",
        text: NEXT_CONTACT_LABELS[p.nextContactType] ?? "Seguimiento",
        due_date: isoDate(p.date),
      });
    }
  }

  for (const c of clients) {
    if (!keep("clientes", c)) continue;
    const contact = contactFor(c.name, c.phone, c.createdAt);
    if (text(c.email)) {
      contact.email_jsonb = [{ email: c.email.trim(), type: "Work" }];
    }
    contact.birthday = isoDate(c.birthday);
    contact.wedding_anniversary = isoDate(c.wedding);
    contact.status = "in-contract";
    // A client replaces the prospect it was converted from.
    contact.deals = contact.deals.filter((d) => d.stage === "won");
    contact.tasks = [];
    contact.deals.push({
      name: `OptimaxxPlus · ${c.name.trim()}`,
      stage: "won",
      categories: ["optimaxx-plus"],
      monthly_contribution: Math.round(c.contribution || 0),
      plan_start: isoDate(c.planStart),
      plan_years: c.term ? Math.round(c.term) : null,
      payment_status: PAYMENT_STATUSES[c.paymentStatus] ?? null,
      month19_contacted: Boolean(c.month19Contacted),
      expected_closing_date: isoDate(c.planStart) ?? today,
      created_at: c.createdAt ?? undefined,
    });
  }

  for (const b of bank) {
    if (!keep("banco", b)) continue;
    const contact = contactFor(
      b.name,
      b.phone,
      isoDate(b.date) ? `${isoDate(b.date)}T12:00:00.000Z` : b.createdAt,
    );
    contact.city ??= text(b.ciudad);
    contact.lead_source ??= LEAD_SOURCES[b.fuente] ?? null;
    contact.referred_by ??= text(b.referido_por);
    contact.status ??= TEMPERATURES[b.temperatura] ?? null;
    if (isoDate(b.ultimo_contacto)) {
      contact.last_seen = `${isoDate(b.ultimo_contacto)}T12:00:00.000Z`;
    }
    if (!contact.tags.includes(BANK_TAG)) contact.tags.push(BANK_TAG);
    const lines = [
      text(b.plan_interes) && `Plan de interés: ${b.plan_interes.trim()}`,
      text(b.notas),
    ].filter(Boolean);
    if (lines.length) {
      contact.notes.push({
        text: lines.join("\n\n"),
        date: contact.first_seen,
      });
    }
    if (isoDate(b.fecha_contactar)) {
      contact.tasks.push({
        type: "call",
        text: "Contactar prospecto del banco",
        due_date: isoDate(b.fecha_contactar),
      });
    }
  }

  return { contacts: [...contacts.values()], skipped };
};

export const summarize = ({ contacts, skipped }) => ({
  contacts: contacts.length,
  deals: contacts.reduce((n, c) => n + c.deals.length, 0),
  notes: contacts.reduce((n, c) => n + c.notes.length, 0),
  tasks: contacts.reduce((n, c) => n + c.tasks.length, 0),
  skipped: skipped.length,
});
