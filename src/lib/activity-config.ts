export const recordSources = {
  consultations: { collection: "consults", title: "Consultations", fields: "member doctor specialty scheduledAt durationMinutes status mode reason cancelledAt cancelledBy cancelReason startedAt endedAt pod accessGrant ekaaySummary prescription" },
  requests: { collection: "consultrequests", title: "Booking requests", fields: "member doctor specialty requestedAt durationMinutes reason status respondedAt declineReason consult" },
  prescriptions: { collection: "prescriptions", title: "Prescriptions", fields: "member doctor consult status source sourceFile items tests signedAt healthRecord" },
  vaccinations: { collection: "vaccinations", title: "Vaccinations", fields: "member doctor prescription consult name brand dose route site instructions schedule doses status" },
  tests: { collection: "testorders", title: "Test reviews", fields: "member doctor booking test orderedAt status reviewedAt" },
  access: { collection: "accessgrants", title: "Access grants", fields: "member doctor status approvedAt expiresAt revokedAt views" },
  accessLogs: { collection: "accesslogs", title: "Record access", fields: "member doctor accessGrant consult what status requestedAt approvedBy approvedAt expiresAt revokedAt ip" },
  conversations: { collection: "askconversations", title: "Ask the record", fields: "member doctor exchanges expiresAt" },
  records: { collection: "healthrecords", title: "Health records", fields: "member type source title recordedAt provider pod consult files values booking remarks disclaimers isSample ekaayNote" },
  bookings: { collection: "bookings", title: "Pod bookings", fields: "member pod profiles tests sex status mobilab orderedByConsult prescription result" },
  reminders: { collection: "reminders", title: "Reminders", fields: "member kind title dose mealTiming note times frequency weekdays everyDays startsOn endsOn dueAt prescription log isActive" },
  family: { collection: "familylinks", title: "Family", fields: "owner member relation relationName" },
  invites: { collection: "familyinvites", title: "Family invitations", fields: "owner phone name relation relationName attempts expiresAt" },
  emergency: { collection: "emergencyprofiles", title: "Emergency profile", fields: "member allergies conditions medicines emergencyContacts organDonor insurance medicalAlert visibleFields" },
  qr: { collection: "qrlinks", title: "QR cards", fields: "member carrier status revokedAt" },
  scans: { collection: "scanlogs", title: "QR scans", fields: "member qrLink scannedAt location ip userAgent alertedContacts" },
  sessions: { collection: "sessions", title: "App sessions", fields: "member expiresAt" },
  doctorSessions: { collection: "doctorsessions", title: "Dashboard sessions", fields: "doctor phone expiresAt" },
  members: { collection: "members", title: "Patients", fields: "name memberId phone email dateOfBirth gender bloodGroup abha plan memberSince validThru" },
  doctors: { collection: "doctors", title: "Doctors", fields: "name phone qualifications registrationNumber council specialties languages city state photoUrl about experienceYears isActive telemedicineConsentAt schedule bookingVersion settings" },
  otpAttempts: { collection: "otpchallenges", title: "App sign-in challenges", fields: "phone name attempts expiresAt" },
  doctorOtpAttempts: { collection: "doctorotpchallenges", title: "Dashboard sign-in challenges", fields: "phone attempts expiresAt" },
  adminAudit: { collection: "admin_audit_logs", title: "Admin audit", fields: "adminId action actorType targetId section source" },
  pods: { collection: "pods", title: "Pods", fields: "name tier siteType address hours location isActive" },
} as const;
export type RecordKey = keyof typeof recordSources;
export const doctorTabs = ["overview", "patients", "consultations", "requests", "prescriptions", "vaccinations", "tests", "access", "accessLogs", "conversations", "doctorSessions", "info", "activity"] as const;
export const patientTabs = ["activity", "consultations", "requests", "prescriptions", "records", "bookings", "vaccinations", "reminders", "family", "invites", "emergency", "qr", "scans", "access", "accessLogs", "sessions", "info"] as const;
export type SearchParams = Record<string, string | string[] | undefined>;
export function single(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
export function pageNumber(value: string | string[] | undefined) {
  const n = Number(single(value));
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 10000) : 1;
}
export function validSource(value: string): value is RecordKey { return Object.hasOwn(recordSources, value); }
export function tabTitle(tab: string) { return tab === "overview" ? "Overview" : tab === "info" ? "Information" : tab === "activity" ? "Activity" : tab === "patients" ? "Patients" : validSource(tab) ? recordSources[tab].title : "Activity"; }
