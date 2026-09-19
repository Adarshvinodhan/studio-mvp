import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

/** Single variable font covers every weight the UI uses (100–900). */
const roboto = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Camtrio Studio",
  description: "Photography business management for Camtrio Weddings",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f3d2e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
