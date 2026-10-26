import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { actorCollections } from "@/db/client";
import { directoryFilter, PAGE_SIZE } from "@/lib/directory.mjs";
import type { WithId } from "mongodb";
import type { Doctor } from "@/models/doctor.model";
import type { Member } from "@/models/member.model";

type DoctorDocument = WithId<Doctor>;
type PatientDocument = WithId<Member>;
import type { Actor, ActorKind, DirectoryQuery, DirectoryResult, Overview } from "@/types/directory";

// Inclusion projections: new clinical fields can never leak through this directory.
const DOCTOR_FIELDS = { name: 1, phone: 1, qualifications: 1, registrationNumber: 1, council: 1, specialties: 1, languages: 1, city: 1, state: 1, isActive: 1, experienceYears: 1, telemedicineConsentAt: 1, createdAt: 1, updatedAt: 1 };
const PATIENT_FIELDS = { name: 1, phone: 1, email: 1, memberId: 1, plan: 1, gender: 1, memberSince: 1, validThru: 1, createdAt: 1, updatedAt: 1 };
const MAX_TIME = { maxTimeMS: 5000 };
const date = (value?: Date | null) => value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : undefined;

function doctor(doc: DoctorDocument): Actor {
  return { id: doc._id.toHexString(), kind: "doctors", name: doc.name || "Unnamed doctor", phone: doc.phone || "", qualifications: doc.qualifications ?? undefined, registrationNumber: doc.registrationNumber ?? undefined, council: doc.council ?? undefined, specialties: doc.specialties ?? [], languages: doc.languages ?? [], city: doc.city ?? undefined, state: doc.state ?? undefined, isActive: doc.isActive ?? undefined, experienceYears: doc.experienceYears ?? undefined, consentAt: date(doc.telemedicineConsentAt), createdAt: date(doc.createdAt), updatedAt: date(doc.updatedAt) };
}
function patient(doc: PatientDocument): Actor {
  return { id: doc._id.toHexString(), kind: "patients", name: doc.name || "Unnamed patient", phone: doc.phone || "", email: doc.email ?? undefined, memberId: doc.memberId ?? undefined, plan: doc.plan ?? undefined, gender: doc.gender ?? undefined, memberSince: date(doc.memberSince), validThru: date(doc.validThru), createdAt: date(doc.createdAt), updatedAt: date(doc.updatedAt) };
}

export async function readDirectory(kind: ActorKind, query: DirectoryQuery): Promise<DirectoryResult> {
  const collections = await actorCollections();
  const filter = directoryFilter(query, kind);
  const collection = kind === "doctors" ? collections.doctors : collections.patients;
  const total = await collection.countDocuments(filter, MAX_TIME);
  const pages = Math.max(1, Math.min(10000, Math.ceil(total / PAGE_SIZE)));
  const page = Math.min(query.page, pages);
  const options = { projection: kind === "doctors" ? DOCTOR_FIELDS : PATIENT_FIELDS, ...MAX_TIME };
  const docs = await collection.find(filter, options).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();
  const items = kind === "doctors" ? (docs as DoctorDocument[]).map(doctor) : (docs as PatientDocument[]).map(patient);
  return { items, total, pages, page, pageSize: PAGE_SIZE };
}

export async function readActor(kind: ActorKind, id: string): Promise<Actor | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const collections = await actorCollections();
  if (kind === "doctors") {
    const doc = await collections.doctors.findOne({ _id: new ObjectId(id) }, { projection: DOCTOR_FIELDS, ...MAX_TIME });
    return doc ? doctor(doc) : null;
  }
  const doc = await collections.patients.findOne({ _id: new ObjectId(id) }, { projection: PATIENT_FIELDS, ...MAX_TIME });
  return doc ? patient(doc) : null;
}

export async function readOverview(): Promise<Overview> {
  const { doctors, patients } = await actorCollections();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [doctorCount, patientCount, activeDoctors, newPatients, recentDoctors, recentPatients] = await Promise.all([
    doctors.countDocuments({}, MAX_TIME), patients.countDocuments({}, MAX_TIME),
    doctors.countDocuments({ isActive: true }, MAX_TIME),
    patients.countDocuments({ createdAt: { $gte: since } } as Filter<PatientDocument>, MAX_TIME),
    doctors.find({}, { projection: DOCTOR_FIELDS, ...MAX_TIME }).sort({ createdAt: -1, _id: -1 }).limit(5).toArray(),
    patients.find({}, { projection: PATIENT_FIELDS, ...MAX_TIME }).sort({ createdAt: -1, _id: -1 }).limit(5).toArray(),
  ]);
  return { doctors: doctorCount, patients: patientCount, activeDoctors, newPatients, recentDoctors: recentDoctors.map(doctor), recentPatients: recentPatients.map(patient) };
}
