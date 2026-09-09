import { NavLink } from "react-router-dom";

export function ResultsNavigation() {
  return (
    <div className="flex gap-6 border-b mb-6">
      <NavLink
        end
        to="/app/admin/results"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-b-2 border-primary text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`
        }
      >
        Operational Results
      </NavLink>
      <NavLink
        to="/app/admin/results/analytics"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-b-2 border-primary text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`
        }
      >
        Cohort Analytics
      </NavLink>
      <NavLink
        to="/app/admin/results/items"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-b-2 border-primary text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`
        }
      >
        Item Analysis
      </NavLink>
      <NavLink
        to="/app/admin/results/exports"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-b-2 border-primary text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`
        }
      >
        Exports
      </NavLink>
    </div>
  );
}
