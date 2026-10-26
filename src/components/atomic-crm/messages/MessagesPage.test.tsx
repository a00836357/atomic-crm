import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { StoryWrapper } from "@/test/StoryWrapper";
import { MessagesPage } from "./MessagesPage";

describe("MessagesPage", () => {
  it("loads the templates from an InsureCRM backup", async () => {
    const screen = await render(
      <StoryWrapper data={{ message_templates: [] }}>
        <MessagesPage />
      </StoryWrapper>,
    );

    const backup = new File(
      [
        JSON.stringify({
          insurecrm_messages_v2: [["Hola [Nombre]!", "Primer mensaje"]],
        }),
      ],
      "crm-respaldo.json",
      { type: "application/json" },
    );
    await expect
      .element(screen.getByRole("button", { name: /Load templates/ }))
      .toBeInTheDocument();
    const input = screen.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await userEvent.upload(input, backup);

    await expect
      .element(screen.getByText("1. Primer contacto"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Block 2" }))
      .toHaveValue("Primer mensaje");
  });

  it("saves an edited block", async () => {
    const screen = await render(
      <StoryWrapper
        data={{
          message_templates: [
            {
              id: 1,
              position: 0,
              key: "birthday",
              title: "Cumpleaños",
              blocks: ["Feliz cumpleaños"],
            },
          ],
        }}
      >
        <MessagesPage />
      </StoryWrapper>,
    );

    const block = screen.getByRole("textbox", { name: "Block 1" });
    await userEvent.fill(block, "¡Feliz cumpleaños, [Nombre]!");
    await userEvent.click(screen.getByText("1. Cumpleaños"));
    await expect
      .element(screen.getByText("Template saved"))
      .toBeInTheDocument();
  });
});
