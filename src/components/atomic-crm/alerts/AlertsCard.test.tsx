import { addDays, format, subMonths } from "date-fns";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { StoryWrapper, buildContact, buildDeal } from "@/test/StoryWrapper";
import { AlertsCard } from "./AlertsCard";

const isoDate = (date: Date) => format(date, "yyyy-MM-dd");

describe("AlertsCard", () => {
  it("lists upcoming events with a WhatsApp link to the contact", async () => {
    const screen = await render(
      <StoryWrapper
        data={{
          contacts: [
            buildContact({
              id: 1,
              first_name: "Ana",
              last_name: "López",
              birthday: isoDate(addDays(subMonths(new Date(), 12 * 30), 5)),
              phone_jsonb: [{ number: "5512345678", type: "Work" }],
            }),
          ],
        }}
      >
        <AlertsCard />
      </StoryWrapper>,
    );

    await expect.element(screen.getByText("Birthday")).toBeInTheDocument();
    await expect.element(screen.getByText("Ana López")).toBeInTheDocument();
    await expect.element(screen.getByText("In 5 days")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: /WhatsApp/ }))
      .toHaveAttribute(
        "href",
        expect.stringMatching(/^https:\/\/wa\.me\/525512345678\?text=/),
      );
  });

  it("clears the month 19 alert once marked as done", async () => {
    const screen = await render(
      <StoryWrapper
        data={{
          contacts: [buildContact({ id: 1, first_name: "Luis" })],
          deals: [
            buildDeal({
              id: 1,
              stage: "won",
              contact_ids: [1],
              plan_start: isoDate(addDays(subMonths(new Date(), 19), 3)),
              month19_contacted: false,
            }),
          ],
        }}
      >
        <AlertsCard />
      </StoryWrapper>,
    );

    await expect
      .element(screen.getByText("Month 19: new options"))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: /Mark as done/ }).click();
    await expect
      .element(screen.getByText("Month 19: new options"))
      .not.toBeInTheDocument();
  });

  it("says so when nothing is coming up", async () => {
    const screen = await render(
      <StoryWrapper data={{ contacts: [buildContact({ id: 1 })] }}>
        <AlertsCard />
      </StoryWrapper>,
    );

    await expect
      .element(screen.getByText("Nothing coming up in the next 30 days."))
      .toBeInTheDocument();
  });
});
