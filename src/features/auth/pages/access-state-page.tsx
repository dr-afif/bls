import { useNavigate } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { useTranslation } from "../../../lib/i18n/use-translation";
import { AuthLayout } from "../components/auth-layout";
import { useAuth } from "../context/auth-context";
import type { AccountStatus } from "../model/auth-types";

export function AccessStatePage({
  status,
  variant = "account",
}: {
  status?: AccountStatus;
  variant?:
    | "account"
    | "configuration"
    | "missing-profile"
    | "missing-role"
    | "role";
}) {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStatusContent = (
    s: AccountStatus,
  ): { title: string; description: string; kind: "denied" | "expired" } => {
    switch (s) {
      case "active":
        return {
          title: "Access is active",
          description: "Your account is ready.",
          kind: "denied",
        };
      case "archived":
        return {
          title: "Account archived",
          description:
            "This account is no longer available. Contact your course administrator if this is unexpected.",
          kind: "denied",
        };
      case "expired":
        return {
          title: "Account access expired",
          description:
            "Your account access period has ended. Contact your course administrator for assistance.",
          kind: "expired",
        };
      case "pending_approval":
        return {
          title: "Approval pending",
          description:
            "Your account is waiting for approval from your course organization.",
          kind: "denied",
        };
      case "pending_registration":
        return {
          title: t("auth.accessState.pendingRegistrationTitle"),
          description: t("auth.accessState.pendingRegistrationDesc"),
          kind: "denied",
        };
      case "pending_verification":
        return {
          title: t("auth.accessState.pendingVerificationTitle"),
          description: t("auth.accessState.pendingVerificationDesc"),
          kind: "denied",
        };
      case "suspended":
        return {
          title: t("auth.accessState.suspendedTitle"),
          description: t("auth.accessState.suspendedDesc"),
          kind: "denied",
        };
    }
  };

  const content = status ? getStatusContent(status) : null;
  const fallback = {
    configuration: {
      title: "Sign-in is not configured",
      description:
        "This deployment needs its public Supabase URL and publishable key. No secret key should be added to frontend code.",
    },
    "missing-profile": {
      title: "Account setup is incomplete",
      description:
        "Your sign-in exists, but its application profile is missing. Contact your course administrator.",
    },
    "missing-role": {
      title: "No application role assigned",
      description:
        "Your account has not been assigned a learner, instructor, or administrator role.",
    },
    role: {
      title: t("auth.accessState.accessDeniedTitle"),
      description: t("auth.accessState.accessDeniedDesc"),
    },
    account: {
      title: t("auth.accessState.accessDeniedTitle"),
      description: "Contact your course administrator for assistance.",
    },
  }[variant];

  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg">
        <StatePanel
          actionLabel={variant === "configuration" ? "Open demo" : t("auth.signOut")}
          as="h1"
          description={content?.description ?? fallback.description}
          kind={content?.kind ?? "denied"}
          onAction={() => {
            if (variant === "configuration") {
              navigate("/demo");
              return;
            }
            void signOut().then(() =>
              navigate("/auth/login", { replace: true }),
            );
          }}
          title={content?.title ?? fallback.title}
        />
      </div>
    </AuthLayout>
  );
}
