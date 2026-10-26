import "server-only";
import { adminCollections } from "@/db/client";
import { readAccountSummary, readActivity, readDoctorOverview, readDoctorPatients, readRecords, recordPeople, type Scope, type RecordPage } from "@/db/repositories/activity";
import { requireAdmin } from "@/services/auth";
import { doctorTabs, patientTabs, pageNumber, single, validSource, type SearchParams } from "@/lib/activity-config";

export async function getWorkspace(params: SearchParams, scope?: Scope) {
  const admin = await requireAdmin();
  if (scope && !/^[a-f\d]{24}$/i.test(scope.id)) throw new Error("Invalid account ID.");
  const allowed: readonly string[] = scope?.kind === "doctors" ? doctorTabs : patientTabs;
  const candidate = single(params.tab);
  let tab = scope && allowed.includes(candidate) ? candidate : scope?.kind === "doctors" ? "overview" : "activity";
  const sourceValue = single(params.source);
  const source = !scope && validSource(sourceValue) ? sourceValue : undefined;
  if (!scope && single(params.view) === "records" && source) tab = "records";
  const recordValue = single(params.record);
  const recordId = (validSource(tab) || tab === "records") && /^[a-f\d]{24}$/i.test(recordValue) ? recordValue : undefined;
  const page = pageNumber(params.page);
  let data: RecordPage;
  const overview = tab === "overview" && scope ? await readDoctorOverview(scope) : [];
  if (tab === "overview") {
    data = { rows: [], total: 0, page: 1, pages: 1 };
  } else if (tab === "records" && source) {
    data = await readRecords(source, page, undefined, recordId);
  } else if (tab === "info" && scope) {
    data = await readRecords(scope.kind === "doctors" ? "doctors" : "members", 1, scope);
  } else if (tab === "patients" && scope) {
    data = await readDoctorPatients(scope.id, page);
  } else if (tab === "activity") {
    data = await readActivity(page, scope, source);
  } else {
    data = await readRecords(validSource(tab) ? tab : "consultations", page, scope, recordId);
  }
  const [people, summary] = await Promise.all([recordPeople([...data.rows, ...overview.flatMap(section => section.rows)]), scope ? readAccountSummary(scope) : Promise.resolve([])]);
  await (await adminCollections()).audit.insertOne({ adminId: admin.id, action: scope ? "view_actor_records" : "view_activity", ...(scope ? { actorType: scope.kind, targetId: scope.id } : {}), section: tab, source, createdAt: new Date() });
  return { ...data, people, summary, overview, tab, source, recordId, loadedAt: Date.now() };
}
