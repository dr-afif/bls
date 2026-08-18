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
const OperationsShell = lazy(() =>
  import("../features/operations/layouts/operations-shell").then((module) => ({ default: module.OperationsShell })),
);
const OperationsPeoplePage = lazy(() =>
  import("../features/operations/pages/people-page").then((module) => ({ default: module.OperationsPeoplePage })),
);
const OperationsCohortsAdminPage = lazy(() =>
  import("../features/operations/pages/cohorts-admin-page").then((module) => ({ default: module.OperationsCohortsAdminPage })),
);
const MyCohortsPage = lazy(() =>
  import("../features/operations/pages/my-cohorts-page").then((module) => ({ default: module.MyCohortsPage })),
);
const ResourcesAdminPage = lazy(() =>
  import("../features/resource-admin/pages/resources-admin-page").then((module) => ({ default: module.ResourcesAdminPage })),
);
const ResourceNewPage = lazy(() =>
  import("../features/resource-admin/pages/resource-new-page").then((module) => ({ default: module.ResourceNewPage })),
);
const ResourceDetailPage = lazy(() =>
  import("../features/resource-admin/pages/resource-detail-page").then((module) => ({ default: module.ResourceDetailPage })),
);
const ResourceTaxonomyPage = lazy(() =>
  import("../features/resource-admin/pages/resource-taxonomy-page").then((module) => ({ default: module.ResourceTaxonomyPage })),
);
const ResourceVersionNewPage = lazy(() =>
  import("../features/resource-admin/pages/resource-version-new-page").then((module) => ({ default: module.ResourceVersionNewPage })),
);
const ResourceVersionPage = lazy(() =>
  import("../features/resource-admin/pages/resource-version-page").then((module) => ({ default: module.ResourceVersionPage })),
);
const QuizzesAdminPage = lazy(() =>
  import("../features/quiz-admin/pages/quizzes-admin-page").then((module) => ({ default: module.QuizzesAdminPage })),
);
const QuestionBankPage = lazy(() =>
  import("../features/quiz-admin/pages/question-bank-page").then((module) => ({ default: module.QuestionBankPage })),
);
const QuestionEditorPage = lazy(() =>
  import("../features/quiz-admin/pages/question-editor-page").then((module) => ({ default: module.QuestionEditorPage })),
);
const QuizEditorPage = lazy(() =>
  import("../features/quiz-admin/pages/quiz-editor-page").then((module) => ({ default: module.QuizEditorPage })),
);
const ResourceLibraryPage = lazy(() =>
  import("../features/resources/pages/resource-library-page").then((module) => ({ default: module.ResourceLibraryPage })),
);
const LiveResourceViewerPage = lazy(() =>
  import("../features/resources/pages/resource-viewer-page").then((module) => ({ default: module.LiveResourceViewerPage })),
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
const LearnerQuizzesPage = lazy(() =>
  import("../features/quiz/pages/learner-quizzes-page").then((module) => ({
    default: module.LearnerQuizzesPage,
  })),
);
const LearnerAttemptPage = lazy(() =>
  import("../features/quiz/pages/learner-attempt-page").then((module) => ({
    default: module.LearnerAttemptPage,
  })),
);
const LearnerResultPage = lazy(() =>
  import("../features/quiz/pages/learner-result-page").then((module) => ({
    default: module.LearnerResultPage,
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
const AdminResultDetailPage = lazy(() =>
  import("../features/admin/pages/result-detail-page").then((module) => ({
    default: module.AdminResultDetailPage,
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
        element: <RequireAccountAccess allowedRoles={["learner"]} />,
        children: [
          {
            path: "/app/learner/*",
            element: deferred(<OperationsShell role="learner" />),
            children: [
              { index: true, element: <Navigate replace to="cohort" /> },
              { path: "cohort", element: deferred(<MyCohortsPage />) },
              { path: "guides", element: deferred(<ResourceLibraryPage scope="learner" />) },
              { path: "guides/:resourceId", element: deferred(<LiveResourceViewerPage scope="learner" />) },
              { path: "quiz", element: deferred(<LearnerQuizzesPage />) },
              { path: "quiz/:quizId/attempt/:attemptId", element: deferred(<LearnerAttemptPage />) },
              { path: "quiz/:quizId/result", element: deferred(<LearnerResultPage />) },
            ],
          },
        ],
      },
      {
        element: <RequireAccountAccess allowedRoles={["instructor"]} />,
        children: [
          {
            path: "/app/instructor/*",
            element: deferred(<OperationsShell role="instructor" />),
            children: [
              { index: true, element: <Navigate replace to="cohorts" /> },
              { path: "cohorts", element: deferred(<MyCohortsPage instructor />) },
              { path: "teaching-kit", element: deferred(<ResourceLibraryPage scope="instructor" />) },
              { path: "teaching-kit/:resourceId", element: deferred(<LiveResourceViewerPage scope="instructor" />) },
            ],
          },
        ],
      },
      {
        element: <RequireAccountAccess allowedRoles={["admin", "super_admin"]} />,
        children: [
          {
            path: "/app/admin/*",
            element: deferred(<OperationsShell role="admin" />),
            children: [
              { index: true, element: <Navigate replace to="people" /> },
              { path: "people", element: deferred(<OperationsPeoplePage />) },
              { path: "cohorts", element: deferred(<OperationsCohortsAdminPage />) },
              { path: "resources", element: deferred(<ResourcesAdminPage />) },
              { path: "resources/new", element: deferred(<ResourceNewPage />) },
              { path: "resources/taxonomy", element: deferred(<ResourceTaxonomyPage />) },
              { path: "resources/:resourceId", element: deferred(<ResourceDetailPage />) },
              { path: "resources/:resourceId/preview", element: deferred(<LiveResourceViewerPage adminPreview scope="instructor" />) },
              { path: "resources/:resourceId/versions/new", element: deferred(<ResourceVersionNewPage />) },
              { path: "resources/:resourceId/versions/:versionId", element: deferred(<ResourceVersionPage />) },
              { path: "quizzes", element: deferred(<QuizzesAdminPage />) },
              { path: "quizzes/new", element: deferred(<QuizEditorPage />) },
              { path: "quizzes/:quizId", element: deferred(<QuizEditorPage />) },
              { path: "questions", element: deferred(<QuestionBankPage />) },
              { path: "questions/new", element: deferred(<QuestionEditorPage />) },
              { path: "questions/:questionId", element: deferred(<QuestionEditorPage />) },
              { path: "results", element: deferred(<AdminResultsPage />) },
              { path: "results/:attemptId", element: deferred(<AdminResultDetailPage />) },
            ],
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
