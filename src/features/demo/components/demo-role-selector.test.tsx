import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DemoRoleSelector } from "./demo-role-selector";

describe("DemoRoleSelector", () => {
  it("exposes all demo roles as accessible radio options", () => {
    render(<DemoRoleSelector onChange={() => undefined} value="learner" />);

    expect(
      screen.getByRole("radio", { name: /^learner/i }),
    ).toBeChecked();
    expect(screen.getByRole("radio", { name: /^instructor/i })).toBeVisible();
    expect(
      screen.getByRole("radio", { name: /^administrator/i }),
    ).toBeVisible();
  });

  it("notifies the caller when another role is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DemoRoleSelector onChange={onChange} value="learner" />);

    await user.click(screen.getByRole("radio", { name: /^instructor/i }));

    expect(onChange).toHaveBeenCalledWith("instructor");
  });
});
