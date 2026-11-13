import { describe, expect, it } from "vitest";

import { cleanTotpCode, needsMfaStep } from "./mfa";

describe("needsMfaStep", () => {
  it("never asks again once the session is aal2", () => {
    expect(
      needsMfaStep({ currentLevel: "aal2", nextLevel: "aal2" }, true),
    ).toBe(false);
  });

  it("asks for the code when a factor exists and the session is aal1", () => {
    expect(
      needsMfaStep({ currentLevel: "aal1", nextLevel: "aal2" }, false),
    ).toBe(true);
  });

  it("lets accounts without a factor in while MFA is optional", () => {
    expect(
      needsMfaStep({ currentLevel: "aal1", nextLevel: "aal1" }, false),
    ).toBe(false);
  });

  it("sends accounts without a factor to enroll once MFA is required", () => {
    expect(
      needsMfaStep({ currentLevel: "aal1", nextLevel: "aal1" }, true),
    ).toBe(true);
  });
});

describe("cleanTotpCode", () => {
  it("keeps the first six digits", () => {
    expect(cleanTotpCode(" 123 456 ")).toBe("123456");
    expect(cleanTotpCode("1234567")).toBe("123456");
    expect(cleanTotpCode("12a3")).toBe("123");
  });
});
