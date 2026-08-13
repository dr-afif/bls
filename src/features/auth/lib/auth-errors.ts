import type { AuthError } from "@supabase/supabase-js";

export function getSafeAuthError(error: unknown) {
  const code = (error as Partial<AuthError> | null)?.code;

  if (code === "invalid_credentials") {
    return "The email or password is incorrect.";
  }

  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Too many attempts. Wait a few minutes, then try again.";
  }

  if (code === "same_password") {
    return "Choose a password you have not used for this account.";
  }

  return "We could not complete that request. Check your connection and try again.";
}

export function buildAuthReturnUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "/auth/callback";
  return url.toString();
}
