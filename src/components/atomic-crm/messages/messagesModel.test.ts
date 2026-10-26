import { describe, expect, it } from "vitest";

import {
  fillBlock,
  fillTemplate,
  greeting,
  templatesFromBackup,
} from "./messagesModel";

const morning = new Date(2026, 9, 26, 9, 0);
const afternoon = new Date(2026, 9, 26, 15, 0);

describe("greeting", () => {
  it("depends on the time of day", () => {
    expect(greeting(morning)).toBe("Buenos días");
    expect(greeting(afternoon)).toBe("Buenas tardes");
    expect(greeting(new Date(2026, 9, 26, 21, 0))).toBe("Buenas noches");
  });
});

describe("fillBlock", () => {
  it("fills the name, the greeting and the years", () => {
    expect(
      fillBlock("Hola [Nombre]! [Buenos días / Buenas tardes].", {
        firstName: "Ana",
        now: afternoon,
      }),
    ).toBe("Hola Ana! Buenas tardes.");
    expect(fillBlock("Hoy se cumple [X] año(s)", { years: 2 })).toBe(
      "Hoy se cumple 2 año(s)",
    );
  });

  it("keeps placeholders it cannot fill", () => {
    expect(fillBlock("Hola [Nombre]! [X]", { now: morning })).toBe(
      "Hola [Nombre]! [X]",
    );
  });
});

describe("fillTemplate", () => {
  it("joins blocks as paragraphs and skips empty ones", () => {
    expect(
      fillTemplate(
        { blocks: ["Hola [Nombre]!", " ", "Saludos!"] },
        { firstName: "Luis" },
      ),
    ).toBe("Hola Luis!\n\nSaludos!");
  });
});

describe("templatesFromBackup", () => {
  it("names the saved blocks after the old CRM templates", () => {
    const templates = templatesFromBackup({
      insurecrm_messages_v2: [["Hola", "Primer"], [], ["Hola", "Después"]],
    });
    expect(templates).toEqual([
      {
        position: 0,
        key: "first_contact",
        title: "Primer contacto",
        blocks: ["Hola", "Primer"],
      },
      {
        position: 2,
        key: "after_presentation",
        title: "Después de presentación",
        blocks: ["Hola", "Después"],
      },
    ]);
  });

  it("returns null for a backup without templates", () => {
    expect(templatesFromBackup({ insurecrm_v1: [] })).toBeNull();
    expect(templatesFromBackup(null)).toBeNull();
  });
});
