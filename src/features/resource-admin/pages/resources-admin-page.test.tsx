import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { I18nContext } from "../../../lib/i18n";
import type { I18nContextValue } from "../../../lib/i18n/types";
import type { AdminResourceCatalog } from "../model/resource-admin-types";
import { ResourcesAdminPage } from "./resources-admin-page";

const mockCatalog: AdminResourceCatalog = {
  courses: [
    { id: "course-1", name: "Basic Life Support", titleMs: "Bantuan Hayat Asas" },
    { id: "course-2", name: "Advanced Resuscitation", titleMs: null },
  ],
  resources: [
    {
      id: "res-1",
      organizationId: "org-1",
      courseId: "course-1",
      courseTitle: "Basic Life Support",
      courseTitleMs: "Bantuan Hayat Asas",
      currentVersionId: "ver-1",
      title: "Adult CPR Guide",
      slug: "adult-cpr-guide",
      type: "guide",
      status: "published",
      contentLanguage: "ms",
      estimatedMinutes: 5,
      featured: true,
      audiences: ["learner"],
      topics: [],
      stages: [],
      availableFrom: null,
      availableUntil: null,
      auditEvents: [],
      updatedAt: "2026-09-24T00:00:00Z",
      versions: [],
    },
    {
      id: "res-2",
      organizationId: "org-1",
      courseId: "course-2",
      courseTitle: "Advanced Resuscitation",
      courseTitleMs: null,
      currentVersionId: "ver-2",
      title: "Defibrillation Protocols",
      slug: "defib-protocols",
      type: "pdf",
      status: "published",
      contentLanguage: "en",
      estimatedMinutes: 8,
      featured: false,
      audiences: ["instructor"],
      topics: [],
      stages: [],
      availableFrom: null,
      availableUntil: null,
      auditEvents: [],
      updatedAt: "2026-09-24T00:00:00Z",
      versions: [],
    },
    {
      id: "res-3",
      organizationId: "org-1",
      courseId: "course-deleted",
      courseTitle: null,
      courseTitleMs: null,
      currentVersionId: "ver-3",
      title: "Orphaned Protocol",
      slug: "orphaned-protocol",
      type: "checklist",
      status: "published",
      contentLanguage: "bilingual",
      estimatedMinutes: 3,
      featured: false,
      audiences: ["learner"],
      topics: [],
      stages: [],
      availableFrom: null,
      availableUntil: null,
      auditEvents: [],
      updatedAt: "2026-09-24T00:00:00Z",
      versions: [],
    },
  ],
  stages: [],
  topics: [],
};

vi.mock("../hooks/use-admin-resources", () => ({
  useAdminResourceCatalog: () => ({
    data: mockCatalog,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function renderWithLocale(locale: "en" | "ms") {
  const contextValue: I18nContextValue = {
    locale,
    setLocale: vi.fn(),
    isUpdatingPreference: false,
    preferenceError: null,
    t: (key: string, params?: Record<string, string | number>) => {
      const enDict: Record<string, string> = {
        "common.status": "Status",
        "resourceAdmin.resources.eyebrow": "Resource Administration",
        "resourceAdmin.resources.filtersSectionAriaLabel": "Resource filters and search",
        "resourceAdmin.resources.showingCountTemplate": "Showing {count} of {total} resources.",
        "resourceAdmin.courseUnavailable": "Course unavailable",
        "resourceAdmin.resources.title": "Resources",
        "resourceAdmin.resources.description": "Manage course materials",
        "resourceAdmin.resources.searchLabel": "Search resources",
        "resourceAdmin.resources.searchPlaceholder": "Filter by title, slug, or course",
        "resourceAdmin.resources.allStatuses": "All statuses",
        "resourceAdmin.resources.allTypes": "All types",
        "resourceAdmin.resources.allAudiences": "All audiences",
        "resourceAdmin.resources.allTopics": "All topics",
        "resourceAdmin.resources.allStages": "All stages",
        "resourceAdmin.resources.status": "Status",
        "resourceAdmin.resources.type": "Type",
        "resourceAdmin.resources.audiences": "Audiences",
        "resourceAdmin.resources.topics": "Topics",
        "resourceAdmin.resources.stages": "Stages",
        "resourceAdmin.resources.manageResource": "Manage resource",
        "resourceAdmin.resources.manageTaxonomy": "Manage taxonomy",
        "resourceAdmin.resources.newResource": "New resource",
        "resourceAdmin.resources.bookmarkNotice": "Filters preserved in URL",
        "resourceAdmin.resources.showingCount": "resources",
        "resourceAdmin.resources.notAssigned": "None",
        "resourceAdmin.resources.versions": "Versions",
        "resourceAdmin.resources.total": "total",
        "resourceAdmin.resources.inactive": "inactive",
        "resourceType.guide": "Guide",
        "resourceType.pdf": "Document",
        "resourceStatus.published": "Published",
        "resourceLanguage.en": "English",
        "resourceLanguage.ms": "Bahasa Melayu",
        "resourceAudience.learner": "Learners",
        "resourceAudience.instructor": "Instructors",
        "resource.featured": "Featured",
        "resource.library.filterType": "Type",
        "resource.library.filterTopic": "BLS topic",
        "resource.library.filterStage": "Teaching stage",
      };
      const msDict: Record<string, string> = {
        "common.status": "Status",
        "resourceAdmin.resources.eyebrow": "Pentadbiran Sumber",
        "resourceAdmin.resources.filtersSectionAriaLabel": "Penapis dan carian sumber",
        "resourceAdmin.resources.showingCountTemplate": "Menunjukkan {count} daripada {total} sumber.",
        "resourceAdmin.courseUnavailable": "Kursus tidak tersedia",
        "resourceAdmin.resources.title": "Sumber",
        "resourceAdmin.resources.description": "Urus bahan kursus",
        "resourceAdmin.resources.searchLabel": "Cari sumber",
        "resourceAdmin.resources.searchPlaceholder": "Tapis mengikut tajuk, slug, atau kursus",
        "resourceAdmin.resources.allStatuses": "Semua status",
        "resourceAdmin.resources.allTypes": "Semua jenis",
        "resourceAdmin.resources.allAudiences": "Semua sasaran",
        "resourceAdmin.resources.allTopics": "Semua topik",
        "resourceAdmin.resources.allStages": "Semua peringkat",
        "resourceAdmin.resources.status": "Status",
        "resourceAdmin.resources.type": "Jenis",
        "resourceAdmin.resources.audiences": "Sasaran",
        "resourceAdmin.resources.topics": "Topik",
        "resourceAdmin.resources.stages": "Peringkat",
        "resourceAdmin.resources.manageResource": "Urus sumber",
        "resourceAdmin.resources.manageTaxonomy": "Urus taksonomi",
        "resourceAdmin.resources.newResource": "Sumber baharu",
        "resourceAdmin.resources.bookmarkNotice": "Penapis dikekalkan dalam URL",
        "resourceAdmin.resources.showingCount": "sumber",
        "resourceAdmin.resources.notAssigned": "Tiada",
        "resourceAdmin.resources.versions": "Versi",
        "resourceAdmin.resources.total": "jumlah",
        "resourceAdmin.resources.inactive": "tidak aktif",
        "resourceType.guide": "Panduan",
        "resourceType.pdf": "Dokumen",
        "resourceStatus.published": "Diterbitkan",
        "resourceLanguage.en": "Bahasa Inggeris",
        "resourceLanguage.ms": "Bahasa Melayu",
        "resourceAudience.learner": "Pelajar",
        "resourceAudience.instructor": "Pengajar",
        "resource.featured": "Pilihan",
        "resource.library.filterType": "Jenis",
        "resource.library.filterTopic": "Topik BLS",
        "resource.library.filterStage": "Peringkat pengajaran",
      };
      const dict = locale === "ms" ? msDict : enDict;
      let text = dict[key] ?? key;
      if (params) {
        for (const [pKey, pVal] of Object.entries(params)) {
          text = text.replaceAll(`{${pKey}}`, String(pVal));
        }
      }
      return text;
    },
    formatDate: (val: string | number | Date) => new Date(val).toLocaleDateString(),
    formatDateTime: (val: string | number | Date) => new Date(val).toLocaleString(),
    formatNumber: (val: number) => String(val),
  };

  return render(
    <I18nContext.Provider value={contextValue}>
      <MemoryRouter>
        <ResourcesAdminPage />
      </MemoryRouter>
    </I18nContext.Provider>,
  );
}

describe("ResourcesAdminPage bilingual rendering and search", () => {
  it("renders English course titles when locale is en", () => {
    renderWithLocale("en");

    expect(screen.getByRole("heading", { name: "Adult CPR Guide" })).toBeInTheDocument();
    expect(screen.getByText(/adult-cpr-guide · Basic Life Support/)).toBeInTheDocument();
    expect(screen.getByText(/defib-protocols · Advanced Resuscitation/)).toBeInTheDocument();
    expect(screen.getByText(/orphaned-protocol · Course unavailable/)).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 resources.")).toBeInTheDocument();
  });

  it("renders Bahasa Melayu course title when present, falling back to English when null, and fallback string when both null", () => {
    renderWithLocale("ms");

    // res-1 has courseTitleMs "Bantuan Hayat Asas"
    expect(screen.getByText(/adult-cpr-guide · Bantuan Hayat Asas/)).toBeInTheDocument();
    // res-2 has courseTitleMs null, so it falls back to "Advanced Resuscitation"
    expect(screen.getByText(/defib-protocols · Advanced Resuscitation/)).toBeInTheDocument();
    // res-3 has courseTitle null and courseTitleMs null, so it falls back to localized "Kursus tidak tersedia"
    expect(screen.getByText(/orphaned-protocol · Kursus tidak tersedia/)).toBeInTheDocument();
    expect(screen.getByText("Menunjukkan 3 daripada 3 sumber.")).toBeInTheDocument();
  });

  it("renders content language badges for each resource", () => {
    renderWithLocale("en");

    expect(screen.getByText("Bahasa Melayu")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("matches search against both English and Bahasa Melayu course titles", async () => {
    const user = userEvent.setup();
    renderWithLocale("en");

    const searchInput = screen.getByRole("searchbox", { name: "Search resources" });

    // Search by BM course title "Bantuan Hayat Asas"
    await user.type(searchInput, "Bantuan Hayat Asas");
    expect(screen.getByRole("heading", { name: "Adult CPR Guide" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Defibrillation Protocols" })).not.toBeInTheDocument();

    // Clear and search by EN course title "Advanced Resuscitation"
    await user.clear(searchInput);
    await user.type(searchInput, "Advanced Resuscitation");
    expect(screen.getByRole("heading", { name: "Defibrillation Protocols" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Adult CPR Guide" })).not.toBeInTheDocument();
  });
});
