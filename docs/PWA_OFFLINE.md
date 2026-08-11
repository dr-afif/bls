# PWA and Offline Behaviour

## Objective

Provide an installable app-like experience while preserving the security of protected learning content.

## Installability

Include:

- Web app manifest
- 192 by 192 icon
- 512 by 512 icon
- Maskable icon
- Application name
- Short name
- Theme colour
- Background colour
- Standalone display mode
- Start URL
- HTTPS
- Service worker

## Application-shell caching

May cache:

- HTML entry point
- JavaScript bundles
- CSS
- Icons
- Safe fonts
- Static branding
- Offline page

## Protected content

Do not cache:

- PDFs
- YouTube media
- Signed resource URLs
- Quiz answer keys
- Future assessment questions
- Admin reports
- User exports
- Sensitive profile data
- Private certificates unless explicitly designed

## Offline states

When offline:

- The application shell may open.
- A clear offline banner appears.
- Safe previously loaded navigation may remain visible.
- Protected resources do not open.
- New quiz attempts cannot start.
- Quiz submission should not be designed as offline-first in version 1.
- Administrative mutations are disabled.

## Active quiz and connectivity

Recommended first-release behaviour:

- Autosave requires online access.
- If connection fails, keep the current answer locally in memory.
- Show an unsaved warning.
- Retry when connectivity returns.
- Do not allow final submission until required answers are saved.
- The server timer remains authoritative.

## Service-worker updates

When a new build is available:

```text
A new version is available.
[Update now]
```

During an active quiz:

```text
An update is available and will be applied after submission.
```

Do not force-refresh during an active assessment.

## Cache invalidation

- Version application-shell assets by build hash.
- Remove obsolete caches on activation.
- Do not persist signed URLs.
- Clear relevant in-memory state on logout.
- Avoid broad runtime caching rules.

## Installation guidance

Provide a small help section for:

- Android Chrome
- Desktop Chrome or Edge
- iOS Safari where supported
- Removing the installed app
- Updating the app
- Offline limitations

## Future offline expansion

Only consider offline protected content if the project later adopts:

- Encrypted local storage
- Device-bound authorization
- Explicit expiry
- Remote revocation strategy
- Stronger native or managed-app packaging

This is out of scope for the initial release.
