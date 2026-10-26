import { currentAdmin } from "@/services/auth";
import { getDirectory } from "@/services/directory";
import { directoryQuery } from "@/lib/directory.mjs";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
export async function GET(request: Request) {
  try {
    if (!(await currentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    const params = new URL(request.url).searchParams;
    const kind = params.get("kind");
    if (kind !== "doctors" && kind !== "patients") return Response.json({ error: "kind must be doctors or patients" }, { status: 400, headers });
    return Response.json(await getDirectory(kind, directoryQuery(params, kind)), { headers });
  } catch {
    return Response.json({ error: "Directory temporarily unavailable" }, { status: 503, headers });
  }
}
