# Shared database models

This directory contains one model for each of the 23 distinct collections modeled in
`healthmatrix-app/src/server/models` and `healthmatrix-doctor-dashboard/src/models`.
Admin authentication and audit document types remain in `admin.ts`.

## Source choices

- The member app supplies the shared models by default, including the current reminder
  repeat rules, dose logs, booking webhook metadata, and consult booking indexes.
- The dashboard supplies Doctor (including settings), AccessGrant (including OTP verification
  metadata), Prescription (including drafts and source files), and Vaccination.
- Vaccination additionally retains the member app's `doses.givenAt` field.
- FamilyInvite, FamilyLink, OtpChallenge, and Session come from the member app only.
- AccessLog, AskConversation, DoctorOtpChallenge, DoctorSession, and TestOrder come from
  the dashboard only.
- Domain constants combine both sources without duplicate exports.

The source projects are not identical. In particular, the dashboard's older Reminder uses
Date values for `startsOn`/`endsOn` and `{ dueAt, takenAt }` logs. The current member app uses
calendar strings and `{ date, time, status, at }` logs; that current schema is used here.
Existing legacy reminders require an explicit migration before editing through this model.
There is no Family model in either source, although Member retains its existing Family reference.

## Usage

Import models from `@/models` and call `await connectModels()` from `@/db/mongoose`
before querying. The connection uses `MONGODB_URI` and `MONGODB_DB_NAME`, matching the
existing native MongoDB data layer. Models retain source names and Mongoose collection names.
Automatic collection and index creation are disabled; schema imports do not migrate the database.

The existing doctor/patient directory continues using native MongoDB projections, with its
storage types inferred from the full Doctor and Member schemas. UI DTOs remain separate.
Adding these models does not add management screens or mutation endpoints.
