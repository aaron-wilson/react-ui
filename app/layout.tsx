import type { Metadata } from "next";
import Link from "next/link";
import { buildConfig } from "../src/config/server";
import { ThemeToggle } from "../src/components/ThemeToggle";
import { AppClientProvider } from "../src/graphql/AppClientProvider";
import { AuthControls } from "../src/auth/AuthControls";
import { MonitoringBoundary } from "../src/monitoring/MonitoringBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wander | Plan with room to roam",
  description: "Create and refine a trip at your own pace.",
  metadataBase: new URL(buildConfig.siteOrigin),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MonitoringBoundary>
          <AppClientProvider>
            <div className="shell">
              <header className="flex items-center justify-between py-6">
                <Link className="brand" href="/">
                  Wander<span aria-hidden="true">✦</span>
                </Link>
                <div className="flex items-center gap-3">
                  <AuthControls />
                  <ThemeToggle />
                </div>
              </header>
              {children}
              <footer className="py-10 text-sm opacity-75">Wander · Made for curious days.</footer>
            </div>
          </AppClientProvider>
        </MonitoringBoundary>
      </body>
    </html>
  );
}
