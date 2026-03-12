# Media Storage Decision

## Status

Accepted as the MVP media-storage baseline.

This document defines how uploaded caregiver media should be stored, referenced, and accessed so image upload, parsing, and export work can be implemented against a stable storage contract.

## Decision summary

Use **Supabase Storage** as the managed object-storage layer for MVP media.

For MVP:

- primary supported media type: images
- future-planned but not implemented yet: video upload
- all original uploads live in private storage buckets
- application data stores only metadata and storage paths
- uploads are negotiated through the backend
- reads use signed URLs or backend-mediated access, not public buckets

## Why this approach

### 1. Fits the accepted stack

The current baseline already uses:

- Supabase Auth
- Supabase Storage
- PostgreSQL

Keeping media storage in the same managed platform reduces initial integration overhead.

### 2. Appropriate for sensitive family data

Baby photos are sensitive household data.

MVP should prefer:

- private storage
- short-lived access URLs
- explicit ownership checks before upload or download

### 3. Good enough for image-heavy MVP flows

The near-term product loop is:

- caregiver uploads a meal photo
- backend stores metadata
- parsing runs against the uploaded object
- the image remains available for timeline review and retries

Supabase Storage supports that without adding custom object infrastructure.

## Media scope for MVP

### Required now

- image upload
- image persistence for parsing retries and timeline history
- optional derived thumbnails later

### Explicitly deferred

- caregiver-facing video upload UI
- transcoding pipeline
- video streaming optimization
- public CDN-style media delivery

Videos should remain a planned extension of the same storage model, but they are not part of the MVP shipping scope.

## Bucket model

Use private buckets separated by operational purpose:

### `meal-media`

Stores original caregiver-uploaded meal images.

Expected contents:

- raw image uploads
- future video uploads if the product expands into video capture

### `derived-media`

Stores generated or transformed assets when needed later.

Expected contents:

- thumbnails
- compressed derivatives
- export-prep copies if necessary

For MVP, `derived-media` can exist as a reserved concept even if only `meal-media` is used initially.

## Object path convention

Use deterministic paths to keep ownership and cleanup simple.

Recommended path shape:

```text
babies/{baby_id}/messages/{message_id}/{asset_id}.{ext}
```

If a derivative asset is created later:

```text
babies/{baby_id}/messages/{message_id}/derived/{asset_id}-{variant}.{ext}
```

This keeps objects aligned with:

- baby ownership
- message-level raw input preservation
- optional later meal-record linkage

## Upload model

Use backend-controlled upload negotiation.

Flow:

1. authenticated client requests upload permission
2. backend verifies user access to the target baby
3. backend creates the message and media metadata shell
4. backend returns a scoped upload target
5. client uploads directly to storage
6. client or backend marks upload completion
7. parsing is triggered from the stored object

Do not let the mobile client choose arbitrary bucket paths on its own.

## Access model

### Uploads

- authenticated only
- scoped by baby ownership or caregiver access
- no unauthenticated upload path

### Reads

- use short-lived signed URLs for image display when direct client access is needed
- backend may proxy or re-sign access for tighter control later
- do not expose public bucket URLs for family media

## Database contract

The existing `media_assets` model remains the product source of truth for media metadata.

The storage layer should rely on:

- `media_assets.storage_bucket`
- `media_assets.storage_path`
- `media_assets.mime_type`
- `media_assets.upload_status`
- `media_assets.message_id`
- nullable `media_assets.meal_record_id`

The database does not store image binaries.

## Retention and cleanup

For MVP:

- keep original images unless the user deletes them or retention policy is later defined more narrowly
- retain failed-parse media so retries remain possible
- delete orphaned upload metadata only when the object was never written or upload failed permanently

Retention policy for export, archival, and account deletion should be tightened in a later privacy-focused task.

## Security boundaries

- bucket access must require backend authorization checks
- service-role credentials must remain server-only
- signed URLs should be short-lived
- logs should never include raw signed URLs longer than needed for debugging
- media path generation must not expose guessable public access

## Alternatives considered

### Local filesystem or repo-managed uploads

Rejected because it is not suitable for mobile uploads, scaling, or private family media.

### S3 directly with custom bucket management

Rejected for MVP because it increases operational overhead without solving a current product bottleneck.

### Public buckets with obscured paths

Rejected because obscurity is not an acceptable privacy boundary for baby photos.

## Follow-up implementation tasks now unlocked

- build upload negotiation endpoints in `apps/web`
- define the `meal-media` bucket setup in infrastructure
- wire signed URL reads into mobile timeline rendering
- decide later whether video support belongs in MVP+1 or later

