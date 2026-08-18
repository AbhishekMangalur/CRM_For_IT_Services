import type { Metadata } from "next";

import { AuthProvider } from "@/providers/AuthProvider";
import { ConfirmProvider } from "@/providers/ConfirmProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CRM for IT Services",
    template: "%s | CRM for IT Services",
  },
  description:
    "CRM platform for sales, presales, account management, resource allocation and executive reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConfirmProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
