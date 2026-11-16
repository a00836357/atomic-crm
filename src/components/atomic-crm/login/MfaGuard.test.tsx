import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes } from "react-router";

import { MfaGuard } from "./MfaGuard";

const renderGuard = (check: () => Promise<boolean>) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <MfaGuard check={check}>
              <p>CRM content</p>
            </MfaGuard>
          }
        />
        <Route path="/mfa" element={<p>Code screen</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe("MfaGuard", () => {
  it("sends a password-only session to the code screen", async () => {
    const screen = await renderGuard(async () => true);
    await expect.element(screen.getByText("Code screen")).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain("CRM content");
  });

  it("shows the CRM once the session has the code", async () => {
    const screen = await renderGuard(async () => false);
    await expect.element(screen.getByText("CRM content")).toBeInTheDocument();
  });

  it("lets the CRM render when the check fails (e.g. no Supabase)", async () => {
    const screen = await renderGuard(() => {
      throw new Error("supabaseUrl is required");
    });
    await expect.element(screen.getByText("CRM content")).toBeInTheDocument();
  });
});
