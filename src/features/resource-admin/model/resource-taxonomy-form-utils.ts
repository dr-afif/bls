import { z } from "zod";

export const resourceTaxonomySchema = z.object({
  description: z.string().trim().max(500, "Keep the description under 500 characters."),
  displayOrder: z.string().trim().regex(/^\d+$/, "Enter a whole number of zero or more."),
  name: z.string().trim().min(2, "Add a name of at least two characters.").max(100, "Keep the name under 100 characters."),
});

export type ResourceTaxonomyFormValues = z.infer<typeof resourceTaxonomySchema>;

export function slugifyTaxonomyName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
