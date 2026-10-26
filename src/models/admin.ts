import type { ObjectId } from "mongodb";

export interface AdminSessionDocument {
  _id: string;
  adminId: ObjectId;
  credentialVersion: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface LoginBucketDocument {
  _id: string;
  attempts: number;
  expiresAt: Date;
}

export interface AuditDocument {
  adminId?: ObjectId;
  action: "login_success" | "login_failure" | "logout" | "view_overview" | "view_directory" | "view_actor" | "view_activity" | "view_actor_records" | "grant_doctor_access" | "revoke_doctor_access" | "view_enquiries" | "view_enquiry_customer" | "view_enquiry_chat" | "reply_enquiry_chat" | "end_enquiry_chat" | "set_enquiry_status";
  section?: string;
  source?: string;
  actorType?: "doctors" | "patients";
  targetId?: string;
  createdAt: Date;
}
