# Resource Module

## Resource types

Initial:

- YouTube video
- PDF document
- Article or formatted lesson
- Image or infographic

Later:

- External link
- Interactive simulation
- Downloadable file where explicitly allowed

## Course structure

```text
Course
└── Section
    └── Resource
```

Example:

```text
Adult Basic Life Support
├── Introduction
├── Initial assessment
├── Chest compressions
├── Airway and ventilation
├── AED use
└── Integrated BLS sequence
```

## Resource metadata

- Title
- Description
- Type
- Course
- Section
- Display order
- Estimated duration
- Required or optional
- Publication status
- Available-from date
- Available-until date
- Thumbnail
- Version
- Completion rule
- Clinical source
- Reviewer
- Created by
- Updated by
- Archived state

## Video behaviour

Use the official YouTube IFrame Player API.

Track:

- Playback started
- Playback paused
- Current position
- Unique watched ranges
- Seek events
- End event
- Total watched percentage

Recommended completion rule:

- At least 90 percent of unique duration watched
- Playback reached near the end

Do not mark complete solely because the final timestamp was reached.

## PDF behaviour

- Private Storage
- Temporary access
- Controlled PDF.js viewer
- Dynamic watermark
- Page-view progress
- No normal download or print control

Possible completion rule:

- Opened
- Minimum viewing duration
- Minimum proportion of pages viewed
- Last page reached

The completion rule should be configurable.

## Progress states

- not_started
- in_progress
- completed

## Resource availability

A resource may be unavailable because:

- Course entitlement is inactive
- Resource is unpublished
- Resource availability window has not started
- Resource availability window has ended
- Prerequisite resource is incomplete
- Account is suspended
- Storage file is missing
- Temporary access expired

## Resource administration

Administrators should be able to:

- Add YouTube video identifiers
- Upload PDFs
- Edit title and description
- Assign course and section
- Set required or optional
- Configure completion rule
- Reorder resources
- Schedule publication
- Preview learner view
- Replace a resource with a new version
- Retire or archive old resources
- View engagement analytics

## Versioning

A published resource referenced by learner history should not be overwritten.

Create a new `resource_versions` row and update the current version pointer.

Historical progress should retain the version viewed.

## Resource events

Suggested events:

- opened
- closed
- video_played
- video_paused
- video_progress
- video_seeked
- pdf_page_viewed
- completed

Aggregate high-frequency video events to avoid unnecessary database volume.

## Offline behaviour

The course outline may be visible from safe cached metadata, but protected resource content requires online authorization.

## Failure handling

Show distinct states for:

- No network
- Access expired
- Temporary URL expired
- Video unavailable
- PDF unavailable
- Unsupported browser
- Resource retired
