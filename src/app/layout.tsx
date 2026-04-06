import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Onboarding System | Diskothek",
  description: "Digitales Onboarding für Mitarbeiter",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className={inter.className}>
        <div className="layout-wrapper">
          <main className="main-content animate-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
