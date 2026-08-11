# BLS Learning PWA

A responsive, installable companion application for physical Basic Life
Support courses.

The application is designed for learners attending an in-person course,
instructors delivering it, and administrators coordinating people, cohorts,
resources, quizzes, and results. It is resource-first and operational; it is
not a self-paced LMS.

The repository currently contains a role-aware, frontend-only prototype with
distinct learner, instructor, and administrator experiences. It uses fictional
local data and implements the approved resource-first information architecture.
Read
[Product direction](docs/PRODUCT_DIRECTION.md),
[Development handoff](docs/HANDOFF.md), and [Plan](PLAN.md) before planning
new work.

## Recommended stack

- React
- TypeScript
- Vite
- Progressive Web App
- React Router
- Tailwind CSS
- shadcn/ui and Radix UI
- TanStack Query
- React Hook Form and Zod
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase private Storage
- Supabase Edge Functions
- GitHub Actions
- GitHub Pages

## Application type

The first release is a client-side React single-page application hosted as static files.

GitHub Pages hosts the frontend only. Supabase provides authentication, relational data, storage, authorization, server-side functions, and scheduled operations.

The system is online-first. The PWA may cache its application shell and safe static assets, but it must not cache protected PDFs, quiz answers, signed URLs, or sensitive user data.

## Primary product areas

1. Authentication and onboarding
2. Learner cohort home and guides
3. Learner pre-test, post-test, and personal results
4. Instructor home and teaching kit
5. Instructor cohort context
6. People and access administration
7. Cohort and assignment administration
8. Resource and quiz administration
9. Results, analytics, exports, and audit logs

## Important content-protection statement

The system can strongly restrict unauthorized access and discourage casual copying, but no browser-based application can guarantee that displayed content cannot be captured.

The application should use layered controls:

- Authentication
- Active entitlement checks
- Private storage
- Short-lived resource access
- Controlled PDF viewer
- Dynamic watermarking
- Access logging
- Disabled download and print controls
- Restricted offline caching
- Revocation and expiry enforcement

## Documentation

- [Documentation index](docs/INDEX.md)
- [Canonical product direction](docs/PRODUCT_DIRECTION.md)
- [Current development handoff](docs/HANDOFF.md)
- [Product and interface design audit](docs/DESIGN_AUDIT.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Technical specification](docs/TECHNICAL_SPEC.md)
- [UI and UX specification](docs/UI_UX_SPEC.md)
- [Component catalogue](docs/COMPONENTS.md)
- [Data model](docs/DATA_MODEL.md)
- [Authentication and access](docs/AUTH_ACCESS.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Content protection](docs/CONTENT_PROTECTION.md)
- [Resource module](docs/RESOURCE_MODULE.md)
- [Quiz engine](docs/QUIZ_ENGINE.md)
- [Analytics](docs/ANALYTICS.md)
- [PWA and offline behaviour](docs/PWA_OFFLINE.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Testing strategy](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Acceptance tests](docs/ACCEPTANCE_TESTS.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)

## Recommended development sequence

1. Validate the role-aware, resource-first physical-course flow with
   representative users
2. Approve any refinements from prototype feedback
3. Design the production data model and authorization boundary
4. Implement authentication, profiles, roles, and route guards
5. Implement people, cohorts, resources, and protected delivery
6. Implement pre-/post-test security and server-side scoring
7. Implement results, analytics, exports, and audit logging
8. Complete accessibility, security, PWA, and production hardening

## Repository layout

```text
bls-learning-pwa/
├── .github/
│   └── workflows/
├── docs/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── routes/
│   ├── styles/
│   └── types/
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── tests/
│   └── seed.sql
├── tests/
│   ├── e2e/
│   └── fixtures/
├── AGENTS.md
├── CHANGELOG.md
├── PLAN.md
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scope of the first useful MVP

- Role-aware learner, instructor, and administrator accounts
- Learner cohort and physical-course summary
- Learner guides and supporting resources
- Instructor teaching kit organized by topic or teaching stage
- Cohort creation, scheduling, and membership assignment
- Embedded supporting videos and private PDFs
- One pre-test and one post-test
- Single-best-answer questions
- Secure server-side scoring
- Personal learner results
- People and access-status administration
- Resource and quiz-content administration
- Cohort and individual results with basic export
- Audit logging

Certificates, gamification, sequential online modules, resource-completion
pathways, and self-paced course delivery are not part of this MVP.
