import { CalendarRange, Home, Presentation, UserRound } from "lucide-react";

import {
  FieldShell,
  type FieldNavigationItem,
} from "../../../components/common/field-shell";

const instructorNavigation: FieldNavigationItem[] = [
  { to: "/demo/instructor/home", label: "Home", icon: Home },
  {
    to: "/demo/instructor/teaching-kit",
    label: "Teaching Kit",
    icon: Presentation,
  },
  {
    to: "/demo/instructor/cohorts",
    label: "Cohorts",
    icon: CalendarRange,
  },
  { to: "/demo/instructor/profile", label: "Profile", icon: UserRound },
];

export function InstructorShell() {
  return (
    <FieldShell
      navigation={instructorNavigation}
      navigationLabel="Instructor navigation"
      profilePath="/demo/instructor/profile"
      role="instructor"
      roleLabel="Instructor"
      statePatternsPath="/demo/instructor/states"
    />
  );
}
