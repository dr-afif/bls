import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DemoSessionProvider } from "../../features/demo/context/demo-session-context";
import { FieldShell } from "./field-shell";

describe("FieldShell", () => {
  it("renders a compact prototype and demo data label", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <DemoSessionProvider>
          <FieldShell
            navigation={[]}
            navigationLabel="Test Navigation"
            profilePath="/profile"
            role="learner"
            roleLabel="Learner"
            statePatternsPath="/patterns"
          />
        </DemoSessionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Learner prototype")).toBeInTheDocument();
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0);
  });
});
