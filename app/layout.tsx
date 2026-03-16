import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Typing Course",
  description: "A kid-friendly typing course with progressive keyboard lessons and local accounts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
