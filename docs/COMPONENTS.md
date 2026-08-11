# Component Catalogue

> Component priorities follow `PRODUCT_DIRECTION.md`. LMS-oriented pathway and
> completion components have been removed from the role-aware prototype.

## Component layers

### UI primitives

Location:

```text
src/components/ui/
```

Examples:

- Button
- Input
- Textarea
- Checkbox
- RadioGroup
- Select
- Switch
- Badge
- Card
- Dialog
- AlertDialog
- Drawer
- Sheet
- DropdownMenu
- Popover
- Tooltip
- Tabs
- Accordion
- Progress
- Separator
- Skeleton
- Table
- Pagination
- Breadcrumb
- Avatar
- Calendar
- Command
- Toast

UI primitives must not contain BLS-specific business rules.

### Shared application components

Location:

```text
src/components/common/
```

Recommended components:

- `AppLogo`
- `PageHeader`
- `PageContainer`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `AccessDenied`
- `OfflineBanner`
- `ExpiryBadge`
- `StatusBadge`
- `ConfirmActionDialog`
- `ResponsiveDataTable`
- `MobileActionBar`
- `SearchField`
- `FilterBar`
- `PaginationControls`
- `UserAvatarMenu`
- `ThemeToggle`
- `AppBreadcrumbs`
- `ResourceTypeLabel`
- `QuickActionList`
- `SearchAndFilterBar`
- `CohortSummary`
- `AvailabilityNotice`

### Feature components

Store within the owning feature.

## Authentication components

- `AuthLayout`
- `LoginForm`
- `SignupForm`
- `InviteAcceptanceForm`
- `ForgotPasswordForm`
- `ResetPasswordForm`
- `EmailVerificationPanel`
- `PasswordStrengthIndicator`
- `TermsAcceptance`
- `ProfileCompletionForm`
- `AuthenticationErrorAlert`

## Learner home components

- `WelcomeHeader`
- `AccessExpiryAlert`
- `UpcomingCourseCard`
- `CohortDetailsSummary`
- `PreparationNotice`
- `QuizAvailabilityCard`
- `QuickGuidesList`

Do not build `ContinueLearningCard`, `ProgressSummaryGrid`, or `CoursePathway`
for the corrected learner experience.

## Guide-library components

- `GuideSearch`
- `TopicFilterChips`
- `FeaturedGuides`
- `GuideList`
- `GuideListItem`
- `ResourceTypeIcon`
- `ResourceStatusBadge`
- `ResourceMetadata`
- `GuidesEmptyState`
- `ResourceUnavailableState`

Default learner resource states should describe availability or publication,
not online-module completion.

## Instructor home and teaching-kit components

- `NextTeachingSession`
- `TeachingStageShortcuts`
- `RecentTeachingMaterials`
- `CohortReadinessSummary`
- `TeachingKitSearch`
- `TeachingStageFilters`
- `TeachingMaterialList`
- `PresentationLaunchButton`

## Resource components

- `ResourceHeader`
- `VideoResourcePlayer`
- `ProtectedPdfViewer`
- `PdfToolbar`
- `PageNavigator`
- `ZoomControls`
- `WatermarkLayer`
- `ResourceTranscript`
- `KeyPoints`
- `RelatedResources`
- `ResourceAccessError`

## Quiz components

- `QuizInstructions`
- `QuizTimer`
- `QuizProgress`
- `QuestionCard`
- `SingleChoiceQuestion`
- `MultipleChoiceQuestion`
- `TrueFalseQuestion`
- `OrderedSequenceQuestion`
- `ImageChoiceQuestion`
- `QuestionNavigator`
- `FlagQuestionButton`
- `AutosaveIndicator`
- `SubmitQuizDialog`
- `AttemptExpiredDialog`
- `ResultHero`
- `ScoreGauge`
- `PassFailBadge`
- `AttemptSummary`
- `TopicPerformanceChart`
- `RemediationResources`
- `AnswerReview`
- `RetakeButton`

## Admin user components

- `UserDataTable`
- `UserMobileCard`
- `UserFilters`
- `UserDetailsDrawer`
- `AccessStatusBadge`
- `AccessGrantDialog`
- `AccessExtensionDialog`
- `SuspendUserDialog`
- `BulkUserActions`
- `CsvImportDialog`
- `InviteUserDialog`
- `RoleEditor`
- `CohortAssignmentEditor`

## Cohort administration

- `CohortDataTable`
- `CohortMobileCard`
- `CohortFilters`
- `CohortStatusBadge`
- `CohortEditor`
- `CohortScheduleFields`
- `VenueFields`
- `InstructorAssignment`
- `LearnerMembershipEditor`
- `QuizReleaseControls`
- `CohortResultsSummary`

## Resource administration

- `ResourceLibraryTable`
- `ResourceFilters`
- `TopicEditor`
- `TeachingStageEditor`
- `SortableResource`
- `ResourceEditorDrawer`
- `YouTubeResourceForm`
- `PdfUploadForm`
- `ResourcePreview`
- `PublicationControls`
- `ClinicalReviewPanel`

## Question-bank administration

- `QuestionBankTable`
- `QuestionFilters`
- `QuestionEditor`
- `AnswerOptionEditor`
- `CorrectAnswerSelector`
- `ExplanationEditor`
- `ReferenceEditor`
- `QuestionPreview`
- `QuestionVersionHistory`
- `QuestionImportDialog`
- `QuestionReviewPanel`

## Quiz administration

- `QuizDetailsForm`
- `QuestionSelectionRules`
- `FixedQuestionSelector`
- `AssessmentRuleEditor`
- `AttemptPolicyEditor`
- `ReviewPolicyEditor`
- `QuizPreview`
- `PublishChecklist`
- `QuizVersionHistory`

## Analytics components

- `AnalyticsDateRange`
- `MetricCard`
- `EnrollmentTrendChart`
- `CohortComparisonChart`
- `LearningGainChart`
- `QuizCompletionSummary`
- `QuestionAnalysisTable`
- `ExportReportDialog`
- `UsersRequiringAttention`
- `RecentAdminActivity`

## Deferred certificate components

- `CertificateCard`
- `CertificateViewer`
- `CertificateEligibilityPanel`
- `CertificateVerificationForm`
- `CertificateStatusBadge`

Certificate components are long-term possibilities and are not part of the
current MVP or the next frontend prototype.

## Component requirements

Every interactive component should:

- Support keyboard operation
- Expose an accessible name
- Show visible focus
- Handle disabled and loading states
- Avoid colour-only meaning
- Support mobile touch targets
- Provide error text linked to the relevant field
- Avoid leaking sensitive values into the DOM where unnecessary
