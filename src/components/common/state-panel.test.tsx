import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StatePanel } from "./state-panel";

describe("StatePanel", () => {
  it("uses an alert role for recoverable errors", () => {
    render(<StatePanel kind="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not load this screen",
    );
    expect(screen.getByText(/try again/i)).toBeVisible();
  });

  it("provides a keyboard-operable recovery action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <StatePanel
        actionLabel="Try again"
        kind="offline"
        onAction={onAction}
      />,
    );

    const action = screen.getByRole("button", { name: "Try again" });
    action.focus();
    await user.keyboard("{Enter}");

    expect(onAction).toHaveBeenCalledOnce();
  });

  it("defaults to an h2 heading", () => {
    render(<StatePanel kind="empty" />);
    expect(
      screen.getByRole("heading", { level: 2, name: /nothing here yet/i }),
    ).toBeInTheDocument();
  });

  it("renders an h1 heading when as='h1' is supplied", () => {
    render(<StatePanel as="h1" kind="empty" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /nothing here yet/i }),
    ).toBeInTheDocument();
  });
});
