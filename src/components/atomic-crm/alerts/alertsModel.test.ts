import { describe, expect, it } from "vitest";

import type { Contact, Deal } from "../types";
import {
  alertMessage,
  buildAlerts,
  nextQuarterlyReview,
  toWhatsAppNumber,
  whatsAppLink,
} from "./alertsModel";

const today = new Date(2026, 9, 26); // 2026-10-26

const contact = (data: Partial<Contact>) =>
  ({ id: 1, first_name: "Ana María", last_name: "López", ...data }) as Contact;

const deal = (data: Partial<Deal>) =>
  ({
    id: 10,
    stage: "won",
    contact_ids: [1],
    month19_contacted: false,
    ...data,
  }) as Deal;

describe("buildAlerts", () => {
  it("announces birthdays and wedding anniversaries within 30 days", () => {
    const alerts = buildAlerts(
      [
        contact({ id: 1, birthday: "1990-11-05" }),
        contact({ id: 2, wedding_anniversary: "2015-10-26" }),
        contact({ id: 3, birthday: "1990-12-31" }),
      ],
      [],
      today,
    );
    expect(alerts.map((a) => [a.type, a.contact?.id, a.days, a.date])).toEqual([
      ["wedding", 2, 0, "2026-10-26"],
      ["birthday", 1, 10, "2026-11-05"],
    ]);
  });

  it("rolls past birthdays over to next year", () => {
    const alerts = buildAlerts(
      [contact({ birthday: "1990-10-25" })],
      [],
      new Date(2026, 11, 20),
    );
    expect(alerts).toEqual([]);

    const january = buildAlerts(
      [contact({ birthday: "1990-01-05" })],
      [],
      new Date(2026, 11, 20),
    );
    expect(january[0]).toMatchObject({ date: "2027-01-05", days: 16 });
  });

  it("announces the plan anniversary but not the start date itself", () => {
    const contacts = [contact({})];
    expect(
      buildAlerts(contacts, [deal({ plan_start: "2024-11-10" })], today),
    ).toContainEqual(
      expect.objectContaining({ type: "ppr", date: "2026-11-10", days: 15 }),
    );
    expect(
      buildAlerts(contacts, [deal({ plan_start: "2026-10-30" })], today).map(
        (a) => a.type,
      ),
    ).not.toContain("ppr");
  });

  it("only tracks closed, active plans", () => {
    const contacts = [contact({})];
    expect(
      buildAlerts(
        contacts,
        [
          deal({ plan_start: "2024-11-10", stage: "proposal-sent" }),
          deal({ plan_start: "2024-11-10", archived_at: "2026-01-01" }),
          deal({ plan_start: null }),
        ],
        today,
      ),
    ).toEqual([]);
  });

  it("announces month 19 a week ahead and keeps it until marked as done", () => {
    // 2025-03-30 + 19 months = 2026-10-30
    const soon = buildAlerts([], [deal({ plan_start: "2025-03-30" })], today);
    expect(soon).toContainEqual(
      expect.objectContaining({ type: "month19", date: "2026-10-30", days: 4 }),
    );

    // 2025-03-10 + 19 months = 2026-10-10, 16 days ago
    const late = buildAlerts([], [deal({ plan_start: "2025-03-10" })], today);
    expect(late).toContainEqual(
      expect.objectContaining({ type: "month19", days: -16 }),
    );

    const done = buildAlerts(
      [],
      [deal({ plan_start: "2025-03-10", month19_contacted: true })],
      today,
    );
    expect(done.map((a) => a.type)).not.toContain("month19");

    // 2025-04-20 + 19 months = 2026-11-20, too early
    const early = buildAlerts([], [deal({ plan_start: "2025-04-20" })], today);
    expect(early.map((a) => a.type)).not.toContain("month19");
  });

  it("announces quarterly reviews except on plan anniversaries", () => {
    const alerts = buildAlerts([], [deal({ plan_start: "2026-08-05" })], today);
    expect(alerts).toEqual([
      expect.objectContaining({ type: "quarterly", date: "2026-11-05" }),
    ]);

    const anniversary = buildAlerts(
      [],
      [deal({ plan_start: "2025-11-05" })],
      today,
    );
    expect(anniversary.map((a) => a.type)).toEqual(["ppr"]);
  });

  it("links plan alerts to the plan's contact", () => {
    const ana = contact({ id: 7 });
    const [alert] = buildAlerts(
      [ana],
      [deal({ plan_start: "2026-08-05", contact_ids: [7] })],
      today,
    );
    expect(alert.contact).toBe(ana);
  });
});

describe("nextQuarterlyReview", () => {
  it("returns the next 3-month mark from today", () => {
    expect(nextQuarterlyReview("2026-01-15", today)).toEqual({
      date: new Date(2027, 0, 15),
      months: 12,
    });
  });
});

describe("whatsApp helpers", () => {
  it("adds the Mexico country code to 10-digit numbers", () => {
    expect(toWhatsAppNumber("(55) 1234-5678")).toBe("525512345678");
    expect(toWhatsAppNumber("+52 1 55 1234 5678")).toBe("5215512345678");
    expect(toWhatsAppNumber("")).toBeNull();
  });

  it("greets the contact by first name", () => {
    expect(
      alertMessage({
        type: "quarterly",
        date: "2026-11-05",
        days: 10,
        contact: contact({}),
      }),
    ).toMatch(/^Hola Ana, /);
  });

  it("builds a wa.me link with the message", () => {
    const link = whatsAppLink({
      type: "birthday",
      date: "2026-11-05",
      days: 10,
      contact: contact({
        phone_jsonb: [{ number: "5512345678", type: "Work" }],
      }),
    });
    expect(link).toMatch(
      /^https:\/\/wa\.me\/525512345678\?text=%C2%A1Hola%20Ana/,
    );
  });
});
