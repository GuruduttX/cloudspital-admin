export type ActorKind = "doctors" | "patients";
export interface Actor {
  id: string;
  kind: ActorKind;
  name: string;
  phone: string;
  email?: string;
  memberId?: string;
  plan?: string;
  gender?: string;
  validThru?: string;
  memberSince?: string;
  specialties?: string[];
  qualifications?: string;
  registrationNumber?: string;
  council?: string;
  languages?: string[];
  city?: string;
  state?: string;
  isActive?: boolean;
  experienceYears?: number;
  consentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface DirectoryQuery { q: string; filter: string; page: number }
export interface DirectoryResult {
  items: Actor[];
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}
export interface Overview {
  doctors: number;
  patients: number;
  activeDoctors: number;
  newPatients: number;
  recentDoctors: Actor[];
  recentPatients: Actor[];
}
