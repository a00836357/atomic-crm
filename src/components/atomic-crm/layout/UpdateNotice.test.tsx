import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { resetUpdateState, setUpdateAvailable } from "@/lib/appUpdate";
import { StoryWrapper } from "@/test/StoryWrapper";
import { UpdateNotice } from "./UpdateNotice";

afterEach(() => resetUpdateState());

describe("UpdateNotice", () => {
  it("stays hidden while there is no new version", async () => {
    const screen = await render(
      <StoryWrapper>
        <UpdateNotice />
      </StoryWrapper>,
    );
    expect(screen.container.querySelector('[role="status"]')).toBeNull();
  });

  it("appears when a version is published and applies it on click", async () => {
    const apply = vi.fn();
    const screen = await render(
      <StoryWrapper>
        <UpdateNotice />
      </StoryWrapper>,
    );

    setUpdateAvailable(apply);

    await expect
      .element(screen.getByText("A new version is available."))
      .toBeInTheDocument();
    await screen.getByRole("button", { name: "Reload Application" }).click();
    expect(apply).toHaveBeenCalledOnce();
  });
});
