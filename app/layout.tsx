import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "./(dashboard)/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "TIMKER BIDIK 360 — Sistem Terpadu Laporan Pendidikan",
    template: "%s | TIMKER BIDIK 360",
  },
  description: "AI-Powered Educational Command Center — Kecamatan Lemahabang",
  icons: {
    icon: '/tutwuri.png',
    apple: '/tutwuri.png',
  },
  openGraph: {
    title: "TIMKER BIDIK 360",
    description: "AI-Powered Educational Command Center — Kecamatan Lemahabang",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
