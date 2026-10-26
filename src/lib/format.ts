export const number = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "Not recorded";
}
export const label = (value?: string) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Not recorded";
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
export const memberId = (value?: string) => value ? `HM ${value.replace(/(\d{4})(?=\d)/g, "$1 ")}` : "Not recorded";
