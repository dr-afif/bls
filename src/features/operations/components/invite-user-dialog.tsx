import { AlertCircle, UserPlus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useOperationsMutations } from "../hooks/use-operations";
import type { InviteUserInput } from "../data/people-cohorts-repository";

type InviteUserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { fullName: string; role: string; email: string }) => void;
  organizationId?: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "A user with this email address has already been registered.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_NAME: "Full name is required (maximum 160 characters).",
  INVALID_ACCESS_PERIOD: "Please choose a valid expiry date in the future.",
  UNSUPPORTED_ROLE: "Only learner and instructor roles can be invited.",
  ORGANIZATION_MISMATCH: "You can only invite users to your assigned organization.",
  ORGANIZATION_REQUIRED: "Your account is not assigned to an organization.",
  RATE_LIMITED: "Too many invitation attempts. Please wait a moment before trying again.",
  FORBIDDEN: "You do not have permission to invite users.",
  AUTHENTICATION_REQUIRED: "You must be signed in as an administrator.",
};

function InviteUserDialogContent({
  onClose,
  onSuccess,
  organizationId,
}: Omit<InviteUserDialogProps, "isOpen">) {
  const { inviteUser } = useOperationsMutations();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"learner" | "instructor">("learner");
  const [accessMode, setAccessMode] = useState<"unlimited" | "limited">("unlimited");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !inviteUser.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, inviteUser.isPending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter an email address.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Please enter the user's full name.");
      return;
    }

    let isoStartsAt: string | null = null;
    let isoExpiresAt: string | null = null;

    if (accessMode === "limited") {
      if (!expiresAt) {
        setErrorMessage("Please select an expiry date for limited access.");
        return;
      }
      const expDate = new Date(expiresAt);
      if (Number.isNaN(expDate.getTime()) || expDate.getTime() <= Date.now()) {
        setErrorMessage("Expiry date must be in the future.");
        return;
      }
      isoExpiresAt = expDate.toISOString();

      if (startsAt) {
        const startDate = new Date(startsAt);
        if (Number.isNaN(startDate.getTime()) || expDate.getTime() <= startDate.getTime()) {
          setErrorMessage("Expiry date must be after the start date.");
          return;
        }
        isoStartsAt = startDate.toISOString();
      }
    }

    const payload: InviteUserInput = {
      email: trimmedEmail,
      fullName: trimmedName,
      role,
      accessMode,
      startsAt: isoStartsAt,
      expiresAt: isoExpiresAt,
      organizationId: organizationId ?? null,
    };

    try {
      const result = await inviteUser.mutateAsync(payload);
      onSuccess?.({
        fullName: result.fullName,
        role: result.role,
        email: result.email,
      });
      onClose();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const mapped = ERROR_MESSAGES[code] || "The invitation could not be sent. Please check your connection and try again.";
      setErrorMessage(mapped);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-labelledby="invite-dialog-title"
    >
      <Card className="relative w-full max-w-lg border-primary/25 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Administration</p>
            <CardTitle className="text-xl" id="invite-dialog-title">
              Invite user
            </CardTitle>
          </div>
          <Button
            aria-label="Close invitation dialog"
            disabled={inviteUser.isPending}
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div
              aria-live="assertive"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive-soft p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold" htmlFor="invite-email">
                Email address <span className="text-destructive">*</span>
              </label>
              <Input
                autoComplete="off"
                className="mt-1.5"
                disabled={inviteUser.isPending}
                id="invite-email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold" htmlFor="invite-full-name">
                Full name <span className="text-destructive">*</span>
              </label>
              <Input
                autoComplete="off"
                className="mt-1.5"
                disabled={inviteUser.isPending}
                id="invite-full-name"
                name="fullName"
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Doe"
                required
                type="text"
                value={fullName}
              />
            </div>

            <div>
              <fieldset disabled={inviteUser.isPending}>
                <legend className="text-sm font-semibold">Assigned role</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition-colors ${
                      role === "learner"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      checked={role === "learner"}
                      className="sr-only"
                      name="role"
                      onChange={() => setRole("learner")}
                      type="radio"
                      value="learner"
                    />
                    Learner
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition-colors ${
                      role === "instructor"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      checked={role === "instructor"}
                      className="sr-only"
                      name="role"
                      onChange={() => setRole("instructor")}
                      type="radio"
                      value="instructor"
                    />
                    Instructor
                  </label>
                </div>
              </fieldset>
            </div>

            <div>
              <fieldset disabled={inviteUser.isPending}>
                <legend className="text-sm font-semibold">Access period</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition-colors ${
                      accessMode === "unlimited"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      checked={accessMode === "unlimited"}
                      className="sr-only"
                      name="accessMode"
                      onChange={() => setAccessMode("unlimited")}
                      type="radio"
                      value="unlimited"
                    />
                    Unlimited
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition-colors ${
                      accessMode === "limited"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      checked={accessMode === "limited"}
                      className="sr-only"
                      name="accessMode"
                      onChange={() => setAccessMode("limited")}
                      type="radio"
                      value="limited"
                    />
                    Limited window
                  </label>
                </div>
              </fieldset>
            </div>

            {accessMode === "limited" && (
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold" htmlFor="invite-start-date">
                    Access start (optional)
                  </label>
                  <Input
                    className="mt-1 text-sm"
                    disabled={inviteUser.isPending}
                    id="invite-start-date"
                    name="startsAt"
                    onChange={(e) => setStartsAt(e.target.value)}
                    type="datetime-local"
                    value={startsAt}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold" htmlFor="invite-expiry-date">
                    Access expiry <span className="text-destructive">*</span>
                  </label>
                  <Input
                    className="mt-1 text-sm"
                    disabled={inviteUser.isPending}
                    id="invite-expiry-date"
                    name="expiresAt"
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                    type="datetime-local"
                    value={expiresAt}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                disabled={inviteUser.isPending}
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={inviteUser.isPending}
                type="submit"
              >
                <UserPlus aria-hidden="true" className="size-4" />
                {inviteUser.isPending ? "Sending invitation..." : "Send invitation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function InviteUserDialog({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}: InviteUserDialogProps) {
  if (!isOpen) return null;

  return (
    <InviteUserDialogContent
      onClose={onClose}
      onSuccess={onSuccess}
      organizationId={organizationId}
    />
  );
}
