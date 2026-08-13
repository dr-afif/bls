import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleRedirect } from "./role-redirect";

const useAccountAccess = vi.fn();
vi.mock("../hooks/use-account-access", () => ({ useAccountAccess: () => useAccountAccess() }));

function LocationProbe() {
  return <span>{useLocation().pathname}</span>;
}

function renderRedirect() {
  render(<MemoryRouter initialEntries={["/app"]}><Routes><Route path="/app" element={<RoleRedirect />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
}

describe("RoleRedirect", () => {
  beforeEach(() => useAccountAccess.mockReset());

  it.each([
    [["admin"], "/app/admin/people"],
    [["instructor"], "/app/instructor/cohorts"],
    [["learner"], "/app/learner/cohort"],
  ])("routes %s to the live Milestone 3 workspace", (roles, destination) => {
    useAccountAccess.mockReturnValue({ data: { roles } });
    renderRedirect();
    expect(screen.getByText(destination)).toBeInTheDocument();
  });
});
