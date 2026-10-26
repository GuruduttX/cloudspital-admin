import { Suspense } from "react";
import { CustomerPage } from "@/features/enquiries/CustomerPage";
export const metadata = { title: "Customer chats | HealthMatrix Admin" };
type Props = { params: Promise<{ memberId: string }> };
async function Detail({ params }: Props) {
  const { memberId } = await params;
  return <CustomerPage id={memberId} />;
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading customer…
        </div>
      }
    >
      <Detail {...props} />
    </Suspense>
  );
}
