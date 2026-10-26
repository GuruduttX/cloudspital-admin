import { currentAdmin } from "@/services/auth";
import { readWaitingCount } from "@/db/repositories/enquiries";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
/** App chats waiting on the team, for the navigation badge. */
export async function GET() {
  try {
    if (!(await currentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    return Response.json({ waiting: await readWaitingCount() }, { headers });
  } catch {
    return Response.json({ error: "Enquiries temporarily unavailable" }, { status: 503, headers });
  }
}
