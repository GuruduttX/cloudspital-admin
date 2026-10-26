export const number = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "Not recorded";
}
export const label = (value?: string) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Not recorded";
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
export const memberId = (value?: string) => value ? `HM ${value.replace(/(\d{4})(?=\d)/g, "$1 ")}` : "Not recorded";

/* Enquiry times are always shown in India time, on the server and in the browser alike. */
const IST = "Asia/Kolkata";
const dayKey = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
const yearOf = (value: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, year: "numeric" }).format(value);
export const time = (value: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
export const dateTime = (value: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
function shortDate(value: Date, now: Date, weekday: boolean) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: IST, weekday: "short", day: "numeric", month: "short", year: "numeric" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const text = `${weekday ? `${part("weekday")}, ` : ""}${part("day")} ${part("month")}`;
  return yearOf(value) === yearOf(now) ? text : `${text} ${part("year")}`;
}
/** "Today", "Yesterday", "Sat, 10 Oct". */
export function dayLabel(value: string, nowValue: string) {
  const day = new Date(value), now = new Date(nowValue);
  if (dayKey(day) === dayKey(now)) return "Today";
  if (dayKey(day) === dayKey(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return shortDate(day, now, true);
}
export const sameDay = (a: string, b: string) => dayKey(new Date(a)) === dayKey(new Date(b));
/** "just now", "2 min ago", "3 h ago", "Yesterday", "10 Oct". `now` comes from the server response. */
export function relativeTime(value: string, nowValue: string) {
  const seconds = Math.max(0, (new Date(nowValue).getTime() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min ago`;
  const label = dayLabel(value, nowValue);
  if (label === "Today") return `${Math.floor(seconds / 3600)} h ago`;
  return label === "Yesterday" ? label : shortDate(new Date(value), new Date(nowValue), false);
}
