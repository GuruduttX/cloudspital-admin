"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { database } from "@/db/client";
import { requireAdmin } from "@/services/auth";

export async function setDoctorAccess(_previous: { error?: string; success?: string }, form: FormData): Promise<{ error?: string; success?: string }> {
  const admin = await requireAdmin();
  const id = form.get("doctorId");
  const active = form.get("active");
  const previous = form.get("previous");
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id) || !["true", "false"].includes(String(active)) || !["true", "false", "unknown"].includes(String(previous))) {
    return { error: "Invalid access request. Reload the page and try again." };
  }
  try {
    const db = await database();
    const doctorId = new ObjectId(id);
    const isActive = active === "true";
    const expected = previous === "unknown" ? { $exists: false } : previous === "true";
    // Compare the displayed state so a stale page cannot overwrite another admin's change.
    const result = await db.collection("doctors").updateOne({ _id: doctorId, isActive: expected }, { $set: { isActive, updatedAt: new Date() } });
    if (!result.matchedCount) return { error: "This account changed or no longer exists. Reload before trying again." };
    await db.collection("admin_audit_logs").insertOne({ adminId: admin.id, action: isActive ? "grant_doctor_access" : "revoke_doctor_access", actorType: "doctors", targetId: id, createdAt: new Date() });
    if (!isActive) await db.collection("doctorsessions").deleteMany({ doctor: doctorId });
  } catch {
    return { error: "Could not complete the access update. Reload to check the current state before retrying." };
  }
  revalidatePath(`/doctors/${id}`);
  revalidatePath("/doctors");
  revalidatePath("/");
  return { success: active === "true" ? "Dashboard access granted." : "Dashboard access revoked." };
}
