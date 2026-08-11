# Content Protection

## Objective

Allow authorized learners to view course resources while reducing casual downloading, copying, and unauthorized sharing.

## Limitation

No browser-based system can guarantee that displayed content cannot be captured.

A learner may still:

- Take a screenshot
- Record the screen
- Photograph the display
- Inspect network activity
- Use browser developer tools
- Share a discovered YouTube URL

The system therefore provides deterrence, access control, traceability, and revocation rather than absolute copy prevention.

## Layered protection

1. Authentication
2. Active course entitlement
3. Published-resource check
4. Private Storage
5. Short-lived access
6. Controlled viewer
7. Watermarking
8. Access logging
9. Disabled normal download and print controls
10. No protected-content offline caching
11. Terms of use
12. Revocation support

## PDF protection

### Storage

- Use a private Supabase Storage bucket.
- Store stable internal paths, not public URLs.
- Validate file type and size.
- Maintain versions for replaced resources.

### Access

1. Learner requests the PDF resource.
2. Backend verifies active entitlement.
3. Backend issues temporary access.
4. Viewer loads the document.
5. Access expires after a short period.
6. Open and progress events are recorded.

### Viewer controls

Include:

- Page navigation
- Zoom
- Fit width
- Fullscreen

Remove:

- Download
- Save
- Print
- Open original
- Direct permanent URL

### Deterrence controls

- Disable context menu in the viewer
- Intercept common save and print shortcuts where practical
- Disable drag behaviour
- Limit text selection if acceptable
- Use a visible dynamic watermark
- Display terms of authorized use

These controls are deterrents, not security boundaries.

### Watermark

Suggested content:

```text
FULL NAME · USER IDENTIFIER · DATE AND TIME
AUTHORISED TRAINING USE ONLY
```

Apply diagonally at low opacity across the viewing region.

### Stronger future option

Rasterize PDF pages into images and deliver them individually. This makes casual text extraction harder but increases storage, processing, and bandwidth.

## Video protection

### Initial provider

Unlisted YouTube videos embedded through the official player.

### Controls

- Store only the video identifier.
- Render the player only after access validation.
- Do not display the raw watch URL.
- Use supported YouTube player controls.
- Track meaningful watched progress.
- Do not claim the video is secure because it is unlisted.

### Better future providers

- Vimeo with domain restrictions
- Cloudflare Stream
- Mux
- Bunny Stream

These can improve tokenized playback and domain restrictions but cannot prevent screen recording.

## Offline

Do not cache:

- PDFs
- Video media
- Signed resource URLs
- Quiz answers
- User exports
- Certificates unless explicitly designed for secure offline access

The offline shell may display a message that protected resources require an internet connection.

## Logging

Record meaningful events:

- Resource opened
- Resource closed
- PDF page viewed
- Video started
- Video paused
- Video completion threshold reached
- Resource completed
- Access denied
- Signed access issued

Avoid unnecessary surveillance or excessive event collection.

## Terms and policy

The learner should accept a policy that states:

- Resources are for authorized training use.
- Redistribution is prohibited.
- Access may be revoked for misuse.
- Visible watermarks may identify the authorized learner.
- Absolute copy prevention cannot be guaranteed.
