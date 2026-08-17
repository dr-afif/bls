import type { Json } from "../../../lib/supabase/database.types";
import type { ResourceType } from "./resource-admin-types";

export const selectClassName = "mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground shadow-sm hover:border-primary/45 sm:text-sm";
export const textareaClassName = "mt-2 min-h-28 w-full rounded-xl border bg-card px-3 py-2 text-base text-foreground shadow-sm placeholder:text-muted-foreground hover:border-primary/45 sm:text-sm";

export function draftBodyFromContent(type: ResourceType, content: Json | null) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return "";
  if (type === "guide") {
    const sections = content.sections;
    if (Array.isArray(sections)) return sections.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      return typeof item.body === "string" ? [item.body] : [];
    }).join("\n\n");
  }
  if (type === "checklist" && Array.isArray(content.items)) {
    return content.items.filter((item): item is string => typeof item === "string").join("\n");
  }
  return "";
}

export function contentFromDraftBody(type: ResourceType, body: string): Json | null {
  if (type === "guide") return { kind: "guide", sections: [{ heading: "Clinical guide", body: body.trim() }] };
  if (type === "checklist") return { kind: "checklist", items: body.split("\n").map((item) => item.trim()).filter(Boolean) };
  return null;
}
