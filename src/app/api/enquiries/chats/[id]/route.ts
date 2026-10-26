import { currentAdmin } from "@/services/auth";
import { markChatRead, readChat } from "@/db/repositories/enquiries";
import { isObjectId } from "@/lib/enquiries";
const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
/**
 * Polled while a chat is on screen. Each poll counts as the team reading it, so the member sees "Seen".
 * `from` returns only the messages after the ones the browser already has.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await currentAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    const { id } = await params;
    if (!isObjectId(id)) return Response.json({ error: "Invalid chat id" }, { status: 400, headers });
    const rawFrom = new URL(request.url).searchParams.get("from") || "0";
    const from = /^\d{1,3}$/.test(rawFrom) ? Number(rawFrom) : 0;
    await markChatRead(id);
    const chat = await readChat(id, from);
    if (!chat) return Response.json({ error: "Chat not found" }, { status: 404, headers });
    return Response.json({ chat, from, now: new Date().toISOString() }, { headers });
  } catch {
    return Response.json({ error: "Chat temporarily unavailable" }, { status: 503, headers });
  }
}
