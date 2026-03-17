import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Space Terminal",
  description: "Bloomberg-style trading terminal — FX, Futures, Metals, Crypto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
