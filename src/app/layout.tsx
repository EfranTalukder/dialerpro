import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Dialer",
  description: "Cold-calling dialer powered by Telnyx",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text font-sans antialiased">{children}</body>
    </html>
  );
}
