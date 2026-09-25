import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  matchesResourceLanguage,
  normalizeLanguageParam,
} from "../model/resource-filter-utils";
import type { CourseResource } from "../model/resource-types";
import { ResourceLibraryPage } from "./resource-library-page";

const resources: CourseResource[] = [
  {
    id: "res-en",
    versionId: "ver-en",
    slug: "chain-en",
    title: "Chain of Survival (English)",
    summary: "Recognition reference in English",
    type: "guide",
    estimatedMinutes: 4,
    featured: true,
    versionNumber: 1,
    guidelineSource: "Fictional",
    guidelineYear: 2026,
    reviewedAt: null,
    nextReviewAt: null,
    youtubeVideoId: null,
    contentLanguage: "en",
    content: { kind: "guide", sections: [{ heading: "Recognise", body: "Call for help" }] },
    topics: [{ id: "topic-one", name: "Recognition", slug: "recognition", displayOrder: 1 }],
    teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }],
    relatedResourceIds: [],
  },
  {
    id: "res-ms",
    versionId: "ver-ms",
    slug: "aed-ms",
    title: "Panduan Pantas AED (BM)",
    summary: "AED reference in Bahasa Melayu",
    type: "pdf",
    estimatedMinutes: 5,
    featured: false,
    versionNumber: 1,
    guidelineSource: "Fictional",
    guidelineYear: 2026,
    reviewedAt: null,
    nextReviewAt: null,
    youtubeVideoId: null,
    contentLanguage: "ms",
    content: null,
    topics: [{ id: "topic-two", name: "AED", slug: "aed", displayOrder: 2 }],
    teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }],
    relatedResourceIds: [],
  },
  {
    id: "res-bilingual",
    versionId: "ver-bi",
    slug: "cpr-bilingual",
    title: "CPR Dual-Language Steps (Bilingual)",
    summary: "CPR protocol written in both English and BM",
    type: "guide",
    estimatedMinutes: 6,
    featured: false,
    versionNumber: 1,
    guidelineSource: "Fictional",
    guidelineYear: 2026,
    reviewedAt: null,
    nextReviewAt: null,
    youtubeVideoId: null,
    contentLanguage: "bilingual",
    content: { kind: "guide", sections: [{ heading: "Compressions", body: "100-120 bpm" }] },
    topics: [{ id: "topic-one", name: "Recognition", slug: "recognition", displayOrder: 1 }],
    teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }],
    relatedResourceIds: [],
  },
  {
    id: "res-independent",
    versionId: "ver-ind",
    slug: "rhythm-timer",
    title: "Metronome Rhythm Audio (Language-Independent)",
    summary: "Pure 110 bpm metronome tones without spoken words",
    type: "checklist",
    estimatedMinutes: 2,
    featured: false,
    versionNumber: 1,
    guidelineSource: "Fictional",
    guidelineYear: 2026,
    reviewedAt: null,
    nextReviewAt: null,
    youtubeVideoId: null,
    contentLanguage: "language_independent",
    content: { kind: "checklist", items: ["Start rhythm", "Maintain 110 bpm"] },
    topics: [{ id: "topic-two", name: "AED", slug: "aed", displayOrder: 2 }],
    teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }],
    relatedResourceIds: [],
  },
];

vi.mock("../hooks/use-resources", () => ({
  useResourceCatalog: () => ({ data: resources, isPending: false, isError: false, refetch: vi.fn() }),
}));

describe("normalizeLanguageParam", () => {
  it("normalizes missing, invalid, and valid URL lang parameter values", () => {
    expect(normalizeLanguageParam(null)).toBe("all");
    expect(normalizeLanguageParam("")).toBe("all");
    expect(normalizeLanguageParam("garbage")).toBe("all");
    expect(normalizeLanguageParam("ALL")).toBe("all");
    expect(normalizeLanguageParam("all")).toBe("all");
    expect(normalizeLanguageParam("en")).toBe("en");
    expect(normalizeLanguageParam("ms")).toBe("ms");
    expect(normalizeLanguageParam("bilingual")).toBe("bilingual");
    expect(normalizeLanguageParam("language_independent")).toBe("language_independent");
  });
});

describe("matchesResourceLanguage semantics", () => {
  it("includes all 4 categories under 'all'", () => {
    expect(matchesResourceLanguage("en", "all")).toBe(true);
    expect(matchesResourceLanguage("ms", "all")).toBe(true);
    expect(matchesResourceLanguage("bilingual", "all")).toBe(true);
    expect(matchesResourceLanguage("language_independent", "all")).toBe(true);
  });

  it("includes EN and bilingual under English filter, excluding MS and language_independent", () => {
    expect(matchesResourceLanguage("en", "en")).toBe(true);
    expect(matchesResourceLanguage("bilingual", "en")).toBe(true);
    expect(matchesResourceLanguage("ms", "en")).toBe(false);
    expect(matchesResourceLanguage("language_independent", "en")).toBe(false);
  });

  it("includes MS and bilingual under Bahasa Melayu filter, excluding EN and language_independent", () => {
    expect(matchesResourceLanguage("ms", "ms")).toBe(true);
    expect(matchesResourceLanguage("bilingual", "ms")).toBe(true);
    expect(matchesResourceLanguage("en", "ms")).toBe(false);
    expect(matchesResourceLanguage("language_independent", "ms")).toBe(false);
  });

  it("strictly includes only bilingual under Bilingual filter", () => {
    expect(matchesResourceLanguage("bilingual", "bilingual")).toBe(true);
    expect(matchesResourceLanguage("en", "bilingual")).toBe(false);
    expect(matchesResourceLanguage("ms", "bilingual")).toBe(false);
    expect(matchesResourceLanguage("language_independent", "bilingual")).toBe(false);
  });

  it("strictly includes only language_independent under Language-independent filter", () => {
    expect(matchesResourceLanguage("language_independent", "language_independent")).toBe(true);
    expect(matchesResourceLanguage("en", "language_independent")).toBe(false);
    expect(matchesResourceLanguage("ms", "language_independent")).toBe(false);
    expect(matchesResourceLanguage("bilingual", "language_independent")).toBe(false);
  });
});

describe("ResourceLibraryPage live filtering and URL normalization", () => {
  it("filters live learner resources with search query", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ResourceLibraryPage scope="learner" /></MemoryRouter>);

    expect(screen.getByRole("link", { name: /chain of survival/i })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: /search guides/i }), "Panduan");
    expect(screen.getByRole("link", { name: /panduan pantas aed/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /chain of survival/i })).not.toBeInTheDocument();
    expect(screen.getByText("1 available resource")).toBeVisible();
  });

  it("uses readable labels for live taxonomy filters", () => {
    render(<MemoryRouter><ResourceLibraryPage scope="instructor" /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "All stages" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reinforce" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Recognition" })).toBeVisible();
  });

  it("demonstrates locked language filtering semantics across all 5 filter options", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ResourceLibraryPage scope="learner" /></MemoryRouter>);

    // 1. ALL: Shows all 4
    expect(screen.getByRole("button", { name: "All languages" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /chain of survival/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /panduan pantas aed/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /cpr dual-language steps/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /metronome rhythm audio/i })).toBeVisible();
    expect(screen.getByText("4 available resources")).toBeVisible();

    // 2. ENGLISH: Shows EN + Bilingual
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("link", { name: /chain of survival/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /cpr dual-language steps/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /panduan pantas aed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /metronome rhythm audio/i })).not.toBeInTheDocument();
    expect(screen.getByText("2 available resources")).toBeVisible();

    // 3. BAHASA MELAYU: Shows MS + Bilingual
    await user.click(screen.getByRole("button", { name: "Bahasa Melayu" }));
    expect(screen.getByRole("link", { name: /panduan pantas aed/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /cpr dual-language steps/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /chain of survival/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /metronome rhythm audio/i })).not.toBeInTheDocument();
    expect(screen.getByText("2 available resources")).toBeVisible();

    // 4. BILINGUAL: Shows Bilingual only
    await user.click(screen.getByRole("button", { name: "Bilingual" }));
    expect(screen.getByRole("link", { name: /cpr dual-language steps/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /chain of survival/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /panduan pantas aed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /metronome rhythm audio/i })).not.toBeInTheDocument();
    expect(screen.getByText("1 available resource")).toBeVisible();

    // 5. LANGUAGE-INDEPENDENT: Shows language-independent only
    await user.click(screen.getByRole("button", { name: "Language-independent" }));
    expect(screen.getByRole("link", { name: /metronome rhythm audio/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /chain of survival/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /panduan pantas aed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /cpr dual-language steps/i })).not.toBeInTheDocument();
    expect(screen.getByText("1 available resource")).toBeVisible();

    // Reset to All languages
    await user.click(screen.getByRole("button", { name: "All languages" }));
    expect(screen.getByText("4 available resources")).toBeVisible();
  });

  it("handles malformed bookmarked ?lang=garbage parameter gracefully without hiding resources", () => {
    render(
      <MemoryRouter initialEntries={["/app/learner/guides?lang=garbage"]}>
        <ResourceLibraryPage scope="learner" />
      </MemoryRouter>,
    );

    // Should fall back to All languages and show all 4 resources
    expect(screen.getByRole("button", { name: "All languages" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("4 available resources")).toBeVisible();
    expect(screen.getByRole("link", { name: /chain of survival/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /panduan pantas aed/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /cpr dual-language steps/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /metronome rhythm audio/i })).toBeVisible();
  });
});
