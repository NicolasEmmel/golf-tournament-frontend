import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/common/AppHeader";
import { SignalRProvider } from "@/context/SignalRContext";
import { TournamentProvider } from "@/context/TournamentContext";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: "Live scoring and leaderboards for multi-day golf tournaments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SignalRProvider>
          <TournamentProvider>
            <AppHeader />
            <main className="flex flex-1 flex-col">{children}</main>
          </TournamentProvider>
        </SignalRProvider>
      </body>
    </html>
  );
}
