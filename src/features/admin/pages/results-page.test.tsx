import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdminResultsPage } from "./results-page";

describe("AdminResultsPage", () => {
  it("labels exports as prototype-only and does not generate a file", async () => {
    const user = userEvent.setup();

    render(<AdminResultsPage />);

    const exportButton = await screen.findByRole("button", {
      name: /cohort roster csv · prototype/i,
    });

    await user.click(exportButton);

    expect(
      screen.getByText(/cohort roster csv was not generated/i),
    ).toBeVisible();
  });
});
