"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import OfflineNotice from "@/components/OfflineNotice";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/Layout/Navbar";
import LoaderSkeleton from "@/components/LoaderSkeleton";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // brief overlay on every route change
    setBusy(true);
    const t = setTimeout(() => setBusy(false), 300); // adjust duration if you like
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {busy && (
              <div className="fixed inset-0 z-[1000] grid place-items-center bg-background/70 backdrop-blur">
                <LoaderSkeleton />
              </div>
            )}
            <Navbar />
            <OfflineNotice />
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
