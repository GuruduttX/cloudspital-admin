import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChat } from "@/services/enquiries";
import { ChatView } from "@/features/enquiries/ChatView";
export const metadata = { title: "Chat | HealthMatrix Admin" };
type Props = { params: Promise<{ id: string }> };
async function Detail({ params }: Props) {
  const { id } = await params;
  const data = await getChat(id);
  if (!data) notFound();
  return <ChatView key={data.chat.id} initial={data.chat} others={data.others} initialNow={data.now} />;
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading chat…
        </div>
      }
    >
      <Detail {...props} />
    </Suspense>
  );
}
