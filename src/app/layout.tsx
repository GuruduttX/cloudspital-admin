import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthMatrix Admin",
  description: "HealthMatrix super administrator workspace",
  icons: { icon: "/logo-mark.png" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
