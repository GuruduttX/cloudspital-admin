# HealthMatrix Super Admin

A read-only administration workspace for the HealthMatrix member app and doctor dashboard, using their existing shared MongoDB collections.

## Login and development

Admin credentials are configured directly in the ignored `.env.local` file:

```dotenv
MONGODB_URI=your-shared-mongodb-uri
MONGODB_DB_NAME=healthmatrix
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
ADMIN_NAME="Super Admin"
ADMIN_JWT_SECRET=your-random-signing-secret-at-least-32-bytes
```

A signing secret has already been generated in `.env.local`. Keep `ADMIN_JWT_SECRET` server-only and stable across instances; changing it invalidates every existing JWT.

Local admin credentials have already been added to `.env.local`. Use the values of `ADMIN_EMAIL` and `ADMIN_PASSWORD` at `/login`. You can replace them with your preferred credentials. Restart the development server after changing environment variables.

```bash
npm install
npm run dev -- --port 3002
```

Open http://localhost:3002. There is no authenticator step, account provisioning command, or database admin-user lookup. Admin email/password are read only by server code. Missing credentials disable login. Changing either credential invalidates existing sessions after the server reloads its environment.

Login issues an HS256-signed JWT in an HttpOnly, SameSite=Strict cookie (Secure in production). The JWT and cookie expire eight hours after sign-in. There is no inactivity timeout, refresh token, or sliding renewal: activity never extends the deadline. Every protected request verifies the signature, issuer, audience, role, and expiry. Expired sessions redirect pages to `/login` and APIs return 401. MongoDB retains the token hash for immediate logout revocation and invalidation when credentials change. Account-level login throttling remains. Sessions, login counters, and access audit events use `admin_sessions`, `admin_login_buckets`, and `admin_audit_logs` in the shared database. Actor collections are read-only in this application. Existing admin-user records from previous setup are not used or modified.

## Features

- Overview with account counts and recent registrations.
- Doctor directory with search, active/inactive filters, pagination, and professional details.
- Patient directory with search, membership-plan filters, pagination, and account details.
- Tabbed doctor workspaces with patients, consultations, requests, prescriptions, vaccines, test reviews, access history, conversations and sessions.
- Tabbed patient workspaces with care history, health records, pod bookings, reminders, family links, emergency profiles, QR scans and sessions.
- System activity timeline and full-record browsing by source, including retained access views and dose logs.
- Protected `/api/overview` and `/api/actors?kind=doctors|patients` endpoints.
- Enquiries (`/enquiries`): website form enquiries (`type: contact|demo`) and live app support chats (`type: support`) from the shared `enquiries` collection. Staff set website follow-up status, reply to and end app chats, and see a waiting badge in the navigation. Replies are signed as `SUPPORT_AGENT_NAME` in `src/config/enquiries.ts`. This is the only feature that writes to a shared collection: every write is a single conditional `updateOne` in `src/db/repositories/enquiries.ts`, and the document format must stay exactly as the website and member app write it.
- Responsive layout using `public/plainBg.webp` as the background.

Clinical records, prescriptions, emergency profiles, and ABHA identifiers are excluded from directory results. Patients correspond to `members`, including family-linked members. Pods are care locations and are available through the system activity source filter. Full account workspaces expose clinical details only to authenticated administrators; tokens and OTP secrets remain excluded.

The timeline shows retained database evidence, not every historical edit or deletion. See [activity coverage](src/features/activity/README.md) for attribution and retention limits.

## Structure

```text
src/
  app/                 Routes, layouts, styles, and API handlers
    (admin)/           Protected overview, activity, doctors, and patients
    login/             Email/password sign-in
    api/               Authenticated endpoints
  components/          Shared UI and navigation
  features/            Authentication, account workspaces, activity and directory views
  models/              23 shared schemas, domain constants and admin document types
  db/                  Server-only connection and read-only repositories
  services/            Session checks and audited data access
  lib/                 Credential comparison, query validation, formatting
  types/               Browser-safe directory types
  config/              Application configuration
  constants/           Shared constants
  hooks/               Reusable React hooks
  validations/         Additional validation schemas
  styles/              Additional styles
```

Use the `@/` alias for source imports. Keep secrets and database connections on the server. The two sibling applications are not modified.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
```

Integration tests require local `mongod` and Google Chrome. They launch a temporary isolated MongoDB and override credentials/database configuration for a production server. They do not use the shared database. Screenshots go to ignored `artifacts/`.
