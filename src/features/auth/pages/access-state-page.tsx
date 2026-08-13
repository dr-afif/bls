import { useNavigate } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import type { AccountStatus } from "../model/auth-types";
import { AuthLayout } from "../components/auth-layout";
import { useAuth } from "../context/auth-context";

const statusCopy: Record<AccountStatus, { title: string; description: string; kind: "denied" | "expired" }> = {
  active: {
    title: "Access is active",
    description: "Your account is ready.",
    kind: "denied",
  },
  archived: {
    title: "Account archived",
    description: "This account is no longer available. Contact your course administrator if this is unexpected.",
    kind: "denied",
  },
  expired: {
    title: "Account access expired",
    description: "Your account access period has ended. Contact your course administrator for assistance.",
    kind: "expired",
  },
  pending_approval: {
    title: "Approval pending",
    description: "Your account is waiting for approval from your course organization.",
    kind: "denied",
  },
  pending_verification: {
    title: "Email verification pending",
    description: "Follow the verification instructions sent to your invited email address.",
    kind: "denied",
  },
  suspended: {
    title: "Account suspended",
    description: "This account cannot currently access the companion. Contact your course administrator.",
    kind: "denied",
  },
};

export function AccessStatePage({
  status,
  variant = "account",
}: {
  status?: AccountStatus;
  variant?: "account" | "configuration" | "missing-profile" | "missing-role" | "role";
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const content = status ? statusCopy[status] : null;
  const fallback = {
    configuration: {
      title: "Sign-in is not configured",
      description: "This deployment needs its public Supabase URL and publishable key. No secret key should be added to frontend code.",
    },
    "missing-profile": {
      title: "Account setup is incomplete",
      description: "Your sign-in exists, but its application profile is missing. Contact your course administrator.",
    },
    "missing-role": {
      title: "No application role assigned",
      description: "Your account has not been assigned a learner, instructor, or administrator role.",
    },
    role: {
      title: "This area is not available",
      description: "Your assigned role does not permit this application area.",
    },
    account: {
      title: "Access is not available",
      description: "Contact your course administrator for assistance.",
    },
  }[variant];

  return (
    <AuthLayout>
      <div className="mx-auto max-w-lg">
        <StatePanel
          actionLabel={variant === "configuration" ? "Open demo" : "Sign out"}
          as="h1"
          description={content?.description ?? fallback.description}
          kind={content?.kind ?? "denied"}
          onAction={() => {
            if (variant === "configuration") {
              navigate("/demo");
              return;
            }
            void signOut().then(() => navigate("/auth/login", { replace: true }));
          }}
          title={content?.title ?? fallback.title}
        />
      </div>
    </AuthLayout>
  );
}
