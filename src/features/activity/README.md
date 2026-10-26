# Account workspaces and system activity

`/activity` reads lifecycle timestamps and saved histories across the shared app and dashboard
collections. The source filter also offers a full-record view. Doctor and patient pages use
account-scoped tabs, four summary counts, pagination, expandable details, and cross-account links.
Doctor patients are a distinct union of consultations, requests, prescriptions, vaccinations,
test orders, record access and Ask the record conversations. These relationships include requests
and cancelled consultations; they do not imply a current treatment relationship.

All queries run behind `requireAdmin`. The server uses fixed collection/field allowlists and
validated ObjectIds. Record links retain account scoping. No token hashes, OTP hashes, verification
IDs, member photo bytes or QR bearer codes are projected. Admin reads are themselves audited.

## What activity means

The timeline includes creation and last-update timestamps, explicit lifecycle timestamps (signing,
consultation start/end/cancellation, access approval/revocation, request response, result review,
QR scan, lab webhook), stored access views, reminder dose logs, vaccine doses marked given, saved
Ask the record questions, and existing admin audit records. Times display in Asia/Kolkata.

This is a view of retained database evidence, not an immutable audit log. Related doctor/patient
references identify the people involved, not necessarily the person who performed a change.
`updatedAt` retains only the most recent edit. Deleted/TTL-expired records, previous field values,
intermediate edits, failed operations and unsaved user actions cannot be reconstructed. An exact,
durable who-did-what history requires event instrumentation at the app and dashboard mutation
boundaries. This change does not alter either source product's write behavior.

Queries are paginated (20 rows), time bounded, and use disk-backed aggregation sorts. At higher
data volumes a dedicated persisted event collection should replace global timestamp unions.
This implementation does not add indexes or migrate shared collections.

## Validation

`npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:integration`.
The integration test seeds and destroys an isolated local MongoDB database and exercises Chrome,
including account isolation, distinct related patients, record links, secret exclusion and mobile
layout. It never loads the shared database configuration. It expects a production build first.
