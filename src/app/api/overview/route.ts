import { currentAdmin } from "@/services/auth";
import { getOverview } from "@/services/directory";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
export async function GET() {
  try {
    if (!(await currentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    return Response.json(await getOverview(), { headers });
  } catch {
    return Response.json({ error: "Overview temporarily unavailable" }, { status: 503, headers });
  }
}
