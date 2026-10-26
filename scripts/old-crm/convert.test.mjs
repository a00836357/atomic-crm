import { describe, expect, it } from "vitest";

import {
  BANK_TAG,
  IMPORT_TAG,
  convertBackup,
  splitName,
  summarize,
} from "./convert.mjs";

const today = "2026-10-26";

describe("convertBackup", () => {
  it("turns pipeline prospects into a contact, a deal, a note and a task", () => {
    const { contacts } = convertBackup(
      {
        insurecrm_v1: [
          {
            id: "a",
            name: "Lucía Gómez Peña",
            city: "Hermosillo",
            phone: "662 111 2233",
            stage: "appointment",
            temp: "Hot",
            date: "2026-11-02",
            contribution: 2500,
            term: 15,
            nextContactType: "3",
            notes: "Tiene dos hijos.",
            createdAt: "2026-09-01T10:00:00.000Z",
          },
        ],
      },
      today,
    );

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      first_name: "Lucía",
      last_name: "Gómez Peña",
      city: "Hermosillo",
      status: "hot",
      phone_jsonb: [{ number: "662 111 2233", type: "Work" }],
      tags: [IMPORT_TAG],
      deals: [
        {
          stage: "appointment",
          amount: 2500,
          plan_years: 15,
          categories: ["optimaxx-plus"],
          expected_closing_date: "2026-11-02",
        },
      ],
      notes: [{ text: "Tiene dos hijos." }],
      tasks: [
        {
          type: "follow-up",
          text: "Después de presentación",
          due_date: "2026-11-02",
        },
      ],
    });
  });

  it("does not create follow-up tasks for closed or lost prospects", () => {
    const { contacts } = convertBackup(
      {
        insurecrm_v1: [
          { name: "A B", phone: "1", stage: "closed", date: "2026-11-02" },
          {
            name: "C D",
            phone: "2",
            stage: "not_interested",
            date: "2026-11-02",
          },
        ],
      },
      today,
    );
    expect(contacts.flatMap((c) => c.tasks)).toEqual([]);
    expect(contacts.map((c) => c.deals[0].stage)).toEqual(["won", "lost"]);
  });

  it("turns clients into a closed deal with the policy details", () => {
    const { contacts } = convertBackup(
      {
        insurecrm_clients_v1: [
          {
            name: "Pedro Soto",
            phone: "6621234567",
            email: "pedro@correo.mx",
            planStart: "2025-03-10",
            term: 20,
            contribution: 3000,
            paymentStatus: "atrasado",
            birthday: "1985-05-04",
            wedding: "",
            month19Contacted: true,
          },
        ],
      },
      today,
    );
    expect(contacts[0]).toMatchObject({
      status: "in-contract",
      birthday: "1985-05-04",
      wedding_anniversary: null,
      email_jsonb: [{ email: "pedro@correo.mx", type: "Work" }],
      deals: [
        {
          stage: "won",
          plan_start: "2025-03-10",
          plan_years: 20,
          amount: 3000,
          payment_status: "late",
          month19_contacted: true,
        },
      ],
    });
  });

  it("merges a prospect and a client with the same phone into one contact", () => {
    const { contacts } = convertBackup(
      {
        insurecrm_v1: [
          {
            name: "Pedro Soto",
            phone: "662 123 4567",
            stage: "proposal",
            date: "2026-11-01",
          },
        ],
        insurecrm_clients_v1: [
          {
            name: "Pedro Soto",
            phone: "+52 662 123 4567",
            planStart: "2025-03-10",
          },
        ],
      },
      today,
    );
    expect(contacts).toHaveLength(1);
    expect(contacts[0].deals.map((d) => d.stage)).toEqual(["won"]);
    expect(contacts[0].tasks).toEqual([]);
  });

  it("imports the prospect bank as tagged contacts without deals", () => {
    const { contacts } = convertBackup(
      {
        insurecrm_bank_v1: [
          {
            name: "Rosa Luna",
            phone: "",
            ciudad: "Obregón",
            date: "2026-08-15",
            ultimo_contacto: "2026-09-01",
            fuente: "Referido",
            plan_interes: "Plus",
            temperatura: "Tibio",
            fecha_contactar: "2026-11-10",
            referido_por: "Juan Pérez",
            notas: "Llamar por la tarde.",
          },
        ],
      },
      today,
    );
    expect(contacts[0]).toMatchObject({
      city: "Obregón",
      lead_source: "referral",
      referred_by: "Juan Pérez",
      status: "warm",
      first_seen: "2026-08-15T12:00:00.000Z",
      last_seen: "2026-09-01T12:00:00.000Z",
      tags: [IMPORT_TAG, BANK_TAG],
      deals: [],
      notes: [{ text: "Plan de interés: Plus\n\nLlamar por la tarde." }],
      tasks: [{ type: "call", due_date: "2026-11-10" }],
    });
  });

  it("skips the sample records the old CRM created on its own", () => {
    const result = convertBackup(
      {
        insurecrm_v1: [
          { name: "Carlos Mendoza", phone: "33 1234 5678", stage: "initial" },
          { name: "Carlos Mendoza", phone: "662 000 0000", stage: "initial" },
        ],
        insurecrm_clients_v1: [
          { name: "Patricia Vega", phone: "33 8765 4321" },
        ],
      },
      today,
    );
    expect(summarize(result)).toMatchObject({ contacts: 1, skipped: 2 });
    expect(result.skipped.map((s) => s.reason)).toEqual([
      "dato de ejemplo",
      "dato de ejemplo",
    ]);
  });

  it("handles an empty backup", () => {
    expect(summarize(convertBackup({}, today))).toEqual({
      contacts: 0,
      deals: 0,
      notes: 0,
      tasks: 0,
      skipped: 0,
    });
  });
});

describe("splitName", () => {
  it("uses the first word as first name", () => {
    expect(splitName("  María   José Ruiz ")).toEqual({
      first_name: "María",
      last_name: "José Ruiz",
    });
    expect(splitName("Cher")).toEqual({ first_name: "Cher", last_name: "" });
  });
});
