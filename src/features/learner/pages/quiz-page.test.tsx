import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { LearnerQuizPage } from "./quiz-page";

describe("LearnerQuizPage", () => {
  it("previews released and unreleased post-test states locally", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LearnerQuizPage />
      </MemoryRouter>,
    );

    const releasePreview = await screen.findByRole("button", {
      name: "Preview released state",
    });
    expect(
      screen.getByRole("button", { name: "Post-test unavailable" }),
    ).toBeDisabled();

    await user.click(releasePreview);

    expect(
      screen.getByRole("button", { name: "Preview post-test entry" }),
    ).toBeEnabled();
    expect(
      screen.getByText(/a secure production release has not occurred/i),
    ).toBeVisible();
    expect(releasePreview).toHaveAttribute("aria-pressed", "true");
  });
});
