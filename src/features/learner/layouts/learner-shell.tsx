import { BookOpenText, ClipboardCheck, Home, UserRound } from "lucide-react";

import {
  FieldShell,
  type FieldNavigationItem,
} from "../../../components/common/field-shell";

const learnerNavigation: FieldNavigationItem[] = [
  { to: "/demo/learner/home", label: "Home", icon: Home },
  { to: "/demo/learner/guides", label: "Guides", icon: BookOpenText },
  { to: "/demo/learner/quiz", label: "Quiz", icon: ClipboardCheck },
  { to: "/demo/learner/profile", label: "Profile", icon: UserRound },
];

export function LearnerShell() {
  return (
    <FieldShell
      navigation={learnerNavigation}
      navigationLabel="Learner navigation"
      profilePath="/demo/learner/profile"
      role="learner"
      roleLabel="Learner"
      statePatternsPath="/demo/learner/states"
    />
  );
}
