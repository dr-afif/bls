# Roadmap

## Milestone 0 — Product direction and frontend foundation

- Repository
- Canonical product direction and handoff
- Revised information architecture
- Visual-direction options
- React and Vite setup
- TypeScript strict mode
- Tailwind and shadcn/ui
- Test framework
- Initial design tokens

Exit condition: the user approves a visual direction and the principal
role-based navigation.

Status: complete.

## Milestone 1 — Role-aware frontend prototype

- Frontend-only mock data
- Distinct learner, instructor, and administrator shells
- Learner Home, Guides, Quiz, and Profile
- Instructor Home, Teaching Kit, Cohorts, and Profile
- Administrator Overview, People, Cohorts, Resources, Quizzes, Results, and
  Settings
- Resource viewer patterns
- Responsive and accessibility validation
- No real accounts, protected content, or backend data

Status: implemented; representative-user validation remains.

## Milestone 2 — Production foundation and authentication

- Login
- Signup or invitation
- Verification
- Password reset
- Profiles
- Roles
- Account states
- Learner and instructor layouts
- Admin layout
- PWA shell
- Supabase local development
- Database migrations and RLS tests
- CI and deployment

## Milestone 3 — People, cohorts, and resources

- People and account status
- Physical-course cohorts
- Schedule and venue
- Instructor and learner assignments
- Entitlements
- Supporting videos
- Protected PDFs
- Guide and teaching-kit organization
- Topic and teaching-stage taxonomy
- Resource editor
- Resource versioning
- Audit events

## Milestone 4 — Pre-test and post-test

- Question bank
- Question versions
- Pre-test
- Post-test
- Autosave
- Timer
- Server-side scoring
- Results
- Quiz builder
- Quiz release policy

## Milestone 5 — Results, analytics, and exports

- Cohort analytics
- Pre- and post-test comparison
- Item analysis
- CSV exports
- Expiring-access reporting
- Operational exceptions

## Milestone 6 — Production hardening

- Accessibility audit
- Security review
- Performance review
- Backup and recovery
- Production documentation

## Future possibilities

- Certificates and verification
- Stronger video provider
- Multiple organizations
- Practical-assessment signoff
- Instructor feedback
- Advanced scenario questions
- SCORM or LMS interoperability
- Native wrapper
- Device-managed secure offline content
- Advanced item discrimination
- Automated guideline-review reminders
