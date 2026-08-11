import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { GuidesPage } from "./guides-page";

describe("GuidesPage", () => {
  it("filters the fictional clinical references by search term", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <GuidesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Available references" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /adult cpr quick guide/i }),
    ).toBeVisible();

    await user.type(screen.getByRole("searchbox", { name: /search guides/i }), "AED");

    expect(
      screen.getByRole("link", { name: /aed safety checklist/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /adult cpr quick guide/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 result")).toBeVisible();
  });
});
