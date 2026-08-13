import { lazy, type ReactNode } from "react";
import { createHashRouter, Navigate } from "react-router-dom";

import { RouteLoader } from "../components/common/route-loader";
import { AdminShell } from "../features/admin/layouts/admin-shell";
import {
  RequireAccountAccess,
  RequireAuthentication,
} from "../features/auth/guards/access-guards";
import { InstructorShell } from "../features/instructor/layouts/instructor-shell";
import { LearnerShell } from "../features/learner/layouts/learner-shell";
import { RouteErrorPage } from "../features/system/pages/route-error-page";

const DemoEntryPage = lazy(() =>
  import("../features/demo/pages/demo-entry-page").then((module) => ({
    default: module.DemoEntryPage,
  })),
);
const LoginPage = lazy(() =>
  import("../features/auth/pages/login-page").then((module) => ({
    default: module.LoginPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../features/auth/pages/forgot-password-page").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/reset-password-page").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import("../features/auth/pages/auth-callback-page").then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const RoleRedirect = lazy(() =>
  import("../features/auth/pages/role-redirect").then((module) => ({
    default: module.RoleRedirect,
  })),
);
const ProductionWorkspacePage = lazy(() =>
  import("../features/auth/pages/production-workspace-page").then((module) => ({
    default: module.ProductionWorkspacePage,
  })),
);
const LearnerHomePage = lazy(() =>
  import("../features/learner/pages/home-page").then((module) => ({
    default: module.LearnerHomePage,
  })),
);
const LearnerGuidesPage = lazy(() =>
  import("../features/learner/pages/guides-page").then((module) => ({
    default: module.GuidesPage,
  })),
);
const LearnerQuizPage = lazy(() =>
  import("../features/learner/pages/quiz-page").then((module) => ({
    default: module.LearnerQuizPage,
  })),
);
const LearnerQuizResultPage = lazy(() =>
  import("../features/learner/pages/quiz-result-page").then((module) => ({
    default: module.LearnerQuizResultPage,
  })),
);
const LearnerProfilePage = lazy(() =>
  import("../features/learner/pages/profile-page").then((module) => ({
    default: module.LearnerProfilePage,
  })),
);
const InstructorHomePage = lazy(() =>
  import("../features/instructor/pages/home-page").then((module) => ({
    default: module.InstructorHomePage,
  })),
);
const TeachingKitPage = lazy(() =>
  import("../features/instructor/pages/teaching-kit-page").then((module) => ({
    default: module.TeachingKitPage,
  })),
);
const InstructorCohortsPage = lazy(() =>
  import("../features/instructor/pages/cohorts-page").then((module) => ({
    default: module.InstructorCohortsPage,
  })),
);
const InstructorProfilePage = lazy(() =>
  import("../features/instructor/pages/profile-page").then((module) => ({
    default: module.InstructorProfilePage,
  })),
);
const AdminOverviewPage = lazy(() =>
  import("../features/admin/pages/overview-page").then((module) => ({
    default: module.AdminOverviewPage,
  })),
);
const AdminPeoplePage = lazy(() =>
  import("../features/admin/pages/people-page").then((module) => ({
    default: module.AdminPeoplePage,
  })),
);
const AdminCohortsPage = lazy(() =>
  import("../features/admin/pages/cohorts-page").then((module) => ({
    default: module.AdminCohortsPage,
  })),
);
const AdminResourcesPage = lazy(() =>
  import("../features/admin/pages/resources-page").then((module) => ({
    default: module.AdminResourcesPage,
  })),
);
const AdminQuizzesPage = lazy(() =>
  import("../features/admin/pages/quizzes-page").then((module) => ({
    default: module.AdminQuizzesPage,
  })),
);
const AdminResultsPage = lazy(() =>
  import("../features/admin/pages/results-page").then((module) => ({
    default: module.AdminResultsPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import("../features/admin/pages/settings-page").then((module) => ({
    default: module.AdminSettingsPage,
  })),
);
const ResourceViewerPage = lazy(() =>
  import("../features/prototype/pages/resource-viewer-page").then((module) => ({
    default: module.ResourceViewerPage,
  })),
);
const StatesPage = lazy(() =>
  import("../features/system/pages/states-page").then((module) => ({
    default: module.StatesPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../features/system/pages/not-found-page").then((module) => ({
    default: module.NotFoundPage,
  })),
);

function deferred(element: ReactNode) {
  return <RouteLoader>{element}</RouteLoader>;
}

export const router = createHashRouter([
  {
    path: "/",
    element: deferred(<LoginPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/auth/login",
    element: deferred(<LoginPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/auth/forgot-password",
    element: deferred(<ForgotPasswordPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/auth/callback",
    element: deferred(<AuthCallbackPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    element: <RequireAuthentication />,
    children: [
      {
        path: "/auth/reset-password",
        element: deferred(<ResetPasswordPage />),
      },
      {
        element: <RequireAccountAccess />,
        children: [{ path: "/app", element: deferred(<RoleRedirect />) }],
      },
      {
        element: <RequireAccountAccess allowedRoles={["learner", "instructor"]} />,
        children: [
          {
            path: "/app/learner/*",
            element: deferred(<ProductionWorkspacePage role="learner" />),
          },
        ],
      },
      {
        element: <RequireAccountAccess allowedRoles={["instructor"]} />,
        children: [
          {
            path: "/app/instructor/*",
            element: deferred(<ProductionWorkspacePage role="instructor" />),
          },
        ],
      },
      {
        element: <RequireAccountAccess allowedRoles={["admin", "super_admin"]} />,
        children: [
          {
            path: "/app/admin/*",
            element: deferred(<ProductionWorkspacePage role="admin" />),
          },
        ],
      },
    ],
  },
  {
    path: "/demo",
    element: deferred(<DemoEntryPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: "/demo/learner",
    element: <LearnerShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate replace to="home" /> },
      { path: "home", element: deferred(<LearnerHomePage />) },
      { path: "guides", element: deferred(<LearnerGuidesPage />) },
      {
        path: "guides/:resourceId",
        element: deferred(<ResourceViewerPage />),
      },
      { path: "quiz", element: deferred(<LearnerQuizPage />) },
      { path: "quiz/result", element: deferred(<LearnerQuizResultPage />) },
      { path: "profile", element: deferred(<LearnerProfilePage />) },
      { path: "states", element: deferred(<StatesPage />) },
    ],
  },
  {
    path: "/demo/instructor",
    element: <InstructorShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate replace to="home" /> },
      { path: "home", element: deferred(<InstructorHomePage />) },
      { path: "teaching-kit", element: deferred(<TeachingKitPage />) },
      {
        path: "teaching-kit/:resourceId",
        element: deferred(<ResourceViewerPage />),
      },
      { path: "cohorts", element: deferred(<InstructorCohortsPage />) },
      { path: "profile", element: deferred(<InstructorProfilePage />) },
      { path: "states", element: deferred(<StatesPage />) },
    ],
  },
  {
    path: "/demo/admin",
    element: <AdminShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate replace to="overview" /> },
      { path: "overview", element: deferred(<AdminOverviewPage />) },
      { path: "people", element: deferred(<AdminPeoplePage />) },
      { path: "cohorts", element: deferred(<AdminCohortsPage />) },
      { path: "resources", element: deferred(<AdminResourcesPage />) },
      { path: "quizzes", element: deferred(<AdminQuizzesPage />) },
      { path: "results", element: deferred(<AdminResultsPage />) },
      { path: "settings", element: deferred(<AdminSettingsPage />) },
      { path: "states", element: deferred(<StatesPage />) },
    ],
  },
  {
    path: "*",
    element: deferred(<NotFoundPage />),
  },
]);
