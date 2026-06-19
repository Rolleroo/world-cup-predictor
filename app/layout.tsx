import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 World Cup Predictor",
  description: "Interactive tournament probability explorer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
