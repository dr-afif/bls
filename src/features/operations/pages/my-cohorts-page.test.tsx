import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../lib/i18n";
import type { I18nContextValue } from "../../../lib/i18n/types";
import type { OperationsCohort } from "../model/operations-types";
import { MyCohortsPage } from "./my-cohorts-page";

const mockCohorts: OperationsCohort[] = [
  {
    id: "cohort-1",
    organizationId: "org-1",
    code: "BLS-2026-01",
    name: "Physical BLS Course",
    nameMs: "Kursus Fizikal BLS",
    description: "Physical provider certification",
    descriptionMs: "Pensijilan penyedia fizikal",
    venue: "Main Hall",
    startAt: "2026-10-01T09:00:00.000Z",
    endAt: "2026-10-01T17:00:00.000Z",
    status: "active",
    contactName: "Instructor Team",
    contactPhone: "0123456789",
    preparationNotes: "Wear comfortable attire",
    members: [],
  },
  {
    id: "cohort-2",
    organizationId: "org-1",
    code: "BLS-2026-02",
    name: "Refresher Course Only EN",
    nameMs: null,
    description: "Refresher without MS name",
    descriptionMs: null,
    venue: "Simulation Lab",
    startAt: "2026-10-05T09:00:00.000Z",
    endAt: "2026-10-05T17:00:00.000Z",
    status: "scheduled",
    contactName: "Operations",
    contactPhone: null,
    preparationNotes: null,
    members: [],
  },
];

vi.mock("../hooks/use-operations", () => ({
  useCohorts: () => ({
    data: mockCohorts,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../components/instructor-cohort-readiness", () => ({
  InstructorCohortReadiness: () => <div data-testid="instructor-readiness" />,
}));

function renderWithLocale(ui: React.ReactElement, locale: "en" | "ms") {
  const contextValue: I18nContextValue = {
    locale,
    setLocale: vi.fn(),
    isUpdatingPreference: false,
    preferenceError: null,
    t: (key: string) => {
      const enDict: Record<string, string> = {
        "operations.myCohorts.learnerTitle": "My course",
        "operations.myCohorts.instructorTitle": "Assigned cohorts",
        "operations.myCohorts.learnerDesc": "Your permitted physical-course schedule",
        "operations.myCohorts.instructorDesc": "Physical-course schedules",
        "operations.myCohorts.schedule": "Schedule",
        "operations.myCohorts.venue": "Venue",
        "operations.myCohorts.courseContact": "Course contact",
        "operations.myCohorts.permittedRoster": "Permitted roster",
        "operations.myCohorts.preparation": "Preparation",
        "cohortStatus.active": "Active",
        "cohortStatus.scheduled": "Scheduled",
      };
      const msDict: Record<string, string> = {
        "operations.myCohorts.learnerTitle": "Kursus saya",
        "operations.myCohorts.instructorTitle": "Kohort ditetapkan",
        "operations.myCohorts.learnerDesc": "Jadual kursus fizikal yang dibenarkan untuk anda",
        "operations.myCohorts.instructorDesc": "Jadual kursus fizikal",
        "operations.myCohorts.schedule": "Jadual",
        "operations.myCohorts.venue": "Tempat",
        "operations.myCohorts.courseContact": "Hubungan kursus",
        "operations.myCohorts.permittedRoster": "Senarai yang dibenarkan",
        "operations.myCohorts.preparation": "Persediaan",
        "cohortStatus.active": "Aktif",
        "cohortStatus.scheduled": "Dijadualkan",
      };
      const dict = locale === "ms" ? msDict : enDict;
      return dict[key] ?? key;
    },
    formatDate: (val: string | number | Date) => new Date(val).toLocaleDateString(),
    formatDateTime: (val: string | number | Date) => new Date(val).toLocaleString(),
    formatNumber: (val: number) => String(val),
  };

  return render(
    <I18nContext.Provider value={contextValue}>
      {ui}
    </I18nContext.Provider>,
  );
}

describe("MyCohortsPage bilingual rendering", () => {
  it("renders English cohort names when locale is en", () => {
    renderWithLocale(<MyCohortsPage instructor={false} />, "en");

    expect(screen.getByRole("heading", { name: "My course" })).toBeInTheDocument();
    expect(screen.getByText("Physical BLS Course")).toBeInTheDocument();
    expect(screen.getByText("Refresher Course Only EN")).toBeInTheDocument();
  });

  it("renders Bahasa Melayu cohort name when present, and falls back to English when null", () => {
    renderWithLocale(<MyCohortsPage instructor={false} />, "ms");

    expect(screen.getByRole("heading", { name: "Kursus saya" })).toBeInTheDocument();
    // cohort-1 has nameMs defined -> renders BM
    expect(screen.getByText("Kursus Fizikal BLS")).toBeInTheDocument();
    expect(screen.queryByText("Physical BLS Course")).not.toBeInTheDocument();

    // cohort-2 has nameMs null -> falls back to EN
    expect(screen.getByText("Refresher Course Only EN")).toBeInTheDocument();
  });

  it("renders instructor headers and readiness component for instructors", () => {
    renderWithLocale(<MyCohortsPage instructor={true} />, "en");

    expect(screen.getByRole("heading", { name: "Assigned cohorts" })).toBeInTheDocument();
    expect(screen.getAllByTestId("instructor-readiness")).toHaveLength(2);
  });
});
