import { z } from "zod";

const publicEnvironmentSchema = z.object({
  VITE_SUPABASE_URL: z
    .url("Use a valid Supabase project URL.")
    .refine((value) => new URL(value).protocol === "https:", {
      message: "The Supabase project URL must use HTTPS.",
    }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1, "Add the Supabase publishable key."),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export type PublicEnvironmentResult =
  | { configured: true; value: PublicEnvironment }
  | { configured: false; issues: string[] };

export function parsePublicEnvironment(
  environment: Record<string, string | undefined>,
): PublicEnvironmentResult {
  const result = publicEnvironmentSchema.safeParse(environment);

  if (result.success) {
    return { configured: true, value: result.data };
  }

  return {
    configured: false,
    issues: result.error.issues.map((issue) => issue.message),
  };
}

export const publicEnvironment = parsePublicEnvironment(import.meta.env);
