import "server-only";
import { adminCollections } from "@/db/client";
import { readActor, readDirectory, readOverview } from "@/db/repositories/actors";
import { requireAdmin } from "@/services/auth";
import type { ActorKind, DirectoryQuery } from "@/types/directory";

export async function getOverview() {
  const admin = await requireAdmin();
  const data = await readOverview();
  await (await adminCollections()).audit.insertOne({ adminId: admin.id, action: "view_overview", createdAt: new Date() });
  return data;
}

export async function getDirectory(kind: ActorKind, query: DirectoryQuery) {
  const admin = await requireAdmin();
  const data = await readDirectory(kind, query);
  // Audit the access without copying names, contact details, or search terms into logs.
  await (await adminCollections()).audit.insertOne({ adminId: admin.id, action: "view_directory", actorType: kind, createdAt: new Date() });
  return data;
}

export async function getActor(kind: ActorKind, id: string) {
  const admin = await requireAdmin();
  const data = await readActor(kind, id);
  if (data) await (await adminCollections()).audit.insertOne({ adminId: admin.id, action: "view_actor", actorType: kind, targetId: id, createdAt: new Date() });
  return data;
}
