import { getEnquiryList } from "@/services/enquiries";
import { enquiryHref, enquiryQuery } from "@/lib/enquiries";
import { EnquiryBoard } from "./EnquiryBoard";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function parameters(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, Array.isArray(value) ? value[0] : value);
  return params;
}
export async function EnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = enquiryQuery(parameters(await searchParams));
  const data = await getEnquiryList(query);
  // Keyed by the URL so a new tab, filter or search starts from fresh server data.
  return <EnquiryBoard key={enquiryHref(query)} initial={data} />;
}
