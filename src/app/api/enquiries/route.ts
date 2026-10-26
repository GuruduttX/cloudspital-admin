import { currentAdmin } from "@/services/auth";
import { readEnquiryList } from "@/db/repositories/enquiries";
import { enquiryQuery } from "@/lib/enquiries";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
/** Polled by the enquiries home every few seconds; the page view itself is what gets audited. */
export async function GET(request: Request) {
  try {
    if (!(await currentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    return Response.json(await readEnquiryList(enquiryQuery(new URL(request.url).searchParams)), { headers });
  } catch {
    return Response.json({ error: "Enquiries temporarily unavailable" }, { status: 503, headers });
  }
}
