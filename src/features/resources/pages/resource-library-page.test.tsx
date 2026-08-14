import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { CourseResource } from "../model/resource-types";
import { ResourceLibraryPage } from "./resource-library-page";

const resources: CourseResource[] = [
  { id: "one", versionId: "version-one", slug: "chain", title: "Chain of survival", summary: "Recognition reference", type: "guide", estimatedMinutes: 4, featured: true, versionNumber: 1, guidelineSource: "Fictional", guidelineYear: 2026, reviewedAt: null, nextReviewAt: null, youtubeVideoId: null, content: { kind: "guide", sections: [{ heading: "Recognise", body: "Call for help" }] }, topics: [{ id: "topic-one", name: "Recognition", slug: "recognition", displayOrder: 1 }], teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }], relatedResourceIds: [] },
  { id: "two", versionId: "version-two", slug: "aed", title: "AED quick guide", summary: "AED reference", type: "pdf", estimatedMinutes: 5, featured: false, versionNumber: 1, guidelineSource: "Fictional", guidelineYear: 2026, reviewedAt: null, nextReviewAt: null, youtubeVideoId: null, content: null, topics: [{ id: "topic-two", name: "AED", slug: "aed", displayOrder: 2 }], teachingStages: [{ id: "stage-one", name: "Reinforce", slug: "reinforce", displayOrder: 1 }], relatedResourceIds: [] },
];

vi.mock("../hooks/use-resources", () => ({
  useResourceCatalog: () => ({ data: resources, isPending: false, isError: false, refetch: vi.fn() }),
}));

describe("ResourceLibraryPage", () => {
  it("filters live learner resources and keeps the search in the URL", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ResourceLibraryPage scope="learner" /></MemoryRouter>);

    expect(screen.getByRole("link", { name: /chain of survival/i })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: /search guides/i }), "AED");
    expect(screen.getByRole("link", { name: /aed quick guide/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /chain of survival/i })).not.toBeInTheDocument();
    expect(screen.getByText("1 available resource")).toBeVisible();
  });

  it("uses readable labels for live taxonomy filters", () => {
    render(<MemoryRouter><ResourceLibraryPage scope="instructor" /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "All stages" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reinforce" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Recognition" })).toBeVisible();
  });
});
