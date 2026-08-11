# Technical Specification

## Application type

A client-side React single-page application built with TypeScript and Vite, installable as a Progressive Web App.

## Frontend stack

| Concern | Technology |
|---|---|
| Framework | React |
| Language | TypeScript in strict mode |
| Build tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Component system | shadcn/ui |
| Accessible primitives | Radix UI |
| Icons | Lucide React |
| Server state | TanStack Query |
| Tables | TanStack Table |
| Forms | React Hook Form |
| Validation | Zod |
| Charts | Recharts |
| Notifications | Sonner |
| Drag and drop | dnd-kit |
| Dates | date-fns |
| PDF rendering | PDF.js or react-pdf |
| Video | YouTube IFrame Player API |
| PWA | vite-plugin-pwa |
| Unit tests | Vitest |
| Component tests | React Testing Library |
| End-to-end tests | Playwright |

## Backend stack

| Concern | Technology |
|---|---|
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Authorization | PostgreSQL Row Level Security |
| File storage | Supabase private Storage |
| Transactional operations | PostgreSQL functions |
| Privileged operations | Supabase Edge Functions |
| Schema management | Supabase migrations |
| Database tests | SQL and pgTAP where appropriate |
| Frontend typing | Generated Supabase TypeScript types |

## Frontend project structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   ├── query-client.ts
│   └── router.tsx
├── components/
│   ├── common/
│   └── ui/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── courses/
│   ├── resources/
│   ├── quizzes/
│   ├── progress/
│   ├── certificates/
│   └── admin/
├── hooks/
├── layouts/
├── lib/
│   ├── analytics/
│   ├── dates/
│   ├── errors/
│   ├── supabase/
│   └── validation/
├── routes/
├── styles/
├── types/
└── main.tsx
```

## Feature-folder pattern

Each feature may contain:

```text
feature-name/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── tests/
├── types/
└── utils/
```

## Supabase client

Frontend environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Never place these in the frontend:

```text
SUPABASE_SECRET_KEY
service_role key
database password
email-provider credentials
YouTube upload credentials
certificate-signing secrets
```

Recommended client configuration:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase configuration.");
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

## Routing

### Public

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/terms`
- `/privacy`
- `/access-expired`

### Learner

- `/app/dashboard`
- `/app/courses`
- `/app/courses/:courseId`
- `/app/resources/:resourceId`
- `/app/quizzes/:quizId/start`
- `/app/attempts/:attemptId`
- `/app/results/:attemptId`
- `/app/progress`
- `/app/certificates`
- `/app/profile`

### Admin

- `/admin`
- `/admin/users`
- `/admin/users/:userId`
- `/admin/cohorts`
- `/admin/courses`
- `/admin/courses/:courseId`
- `/admin/resources`
- `/admin/question-bank`
- `/admin/quizzes`
- `/admin/analytics`
- `/admin/reports`
- `/admin/audit`
- `/admin/settings`

### Route guards

- `RequireAuthentication`
- `RequireActiveAccount`
- `RequireCourseEntitlement`
- `RequireRole`
- `RequireQuizEligibility`

Route guards are user-experience controls only. Backend policies remain authoritative.

## State management

### TanStack Query

Use for server state:

- Profile
- Courses
- Resources
- Entitlements
- Progress
- Quiz attempts
- Results
- Admin lists
- Analytics

Suggested query keys:

```text
['profile', userId]
['courses', userId]
['course', courseId]
['resource', resourceId]
['resource-progress', userId, resourceId]
['quiz-attempt', attemptId]
['admin-users', filters, page]
```

### React state

Use for:

- Dialog visibility
- Tabs
- Local form steps
- Drawer state
- Current mobile filter state

### Zustand

Optional for:

- Complex unsaved course-builder drafts
- Temporary quiz interaction state
- Cross-feature user preferences

Do not add Redux unless later complexity justifies it.

## Forms and validation

Use React Hook Form with Zod.

Validation occurs at:

1. Browser form level
2. RPC or Edge Function level
3. Database constraint level

Frontend validation is never an authorization boundary.

## Error model

```ts
type AppError = {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
  field?: string;
  cause?: unknown;
};
```

Normalize errors into user-facing categories:

- Offline
- Session expired
- Access expired
- Permission denied
- Validation error
- Resource unavailable
- Signed link expired
- Attempt already submitted
- Rate limited
- Server error

## Pagination

Use server-side pagination for:

- Users
- Courses
- Audit events
- Attempts
- Certificates
- Resource events
- Question bank

Recommended default page sizes:

- 25 for dense admin tables
- 20 for mobile card lists
- 50 for export-preview tables where appropriate

## Reordering

Use dnd-kit in the UI and a transactional database function to persist the final order.

Requirements:

- Explicit `display_order`
- Keyboard-accessible alternatives
- Transactional updates
- Unique order within parent scope where practical
- Conflict handling when two administrators edit simultaneously

## Realtime

Realtime is not required for the first release.

Use normal query invalidation and occasional refresh for most admin data. Realtime may be considered later for live cohort monitoring or active-session dashboards.

## Logging

Frontend logs should avoid sensitive data.

Server logs may include:

- Request correlation identifier
- User identifier
- Function name
- Result category
- Duration
- Error code

Do not log quiz answers, passwords, access tokens, or full signed resource URLs.

## Performance goals

- Fast application-shell load
- Lazy-load admin modules
- Lazy-load PDF viewer
- Paginate large tables
- Avoid rendering all question-bank rows
- Compress images
- Use route-level code splitting
- Avoid unnecessary analytics event volume
