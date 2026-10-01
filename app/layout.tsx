import type { Metadata } from "next";
import Link from "next/link";
import { buildConfig } from "../src/config/server";
import { ServiceStatus } from "../src/components/ServiceStatus";
import { SiteNav } from "../src/components/SiteNav";
import { ThemeToggle, themeScript } from "../src/components/ThemeToggle";
import { AppClientProvider } from "../src/graphql/AppClientProvider";
import { AuthControls } from "../src/auth/AuthControls";
import { MonitoringBoundary } from "../src/monitoring/MonitoringBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Wander | Plan with room to roam", template: "%s | Wander" },
  description: "Create and refine a trip at your own pace.",
  metadataBase: new URL(buildConfig.siteOrigin),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <MonitoringBoundary>
          <AppClientProvider>
            <div className="shell">
              <a className="skip-link" href="#content">
                Skip to content
              </a>
              <header className="flex flex-wrap items-center gap-x-5 gap-y-2 py-5">
                <Link className="brand" href="/">
                  Wander<span aria-hidden="true">✦</span>
                </Link>
                <SiteNav />
                <div className="ml-auto flex items-center gap-2">
                  <AuthControls />
                  <ThemeToggle />
                </div>
              </header>
              <div id="content" tabIndex={-1}>
                {children}
              </div>
              <footer className="muted mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[color:var(--line)] py-6 text-sm">
                <p>Wander · Made for curious days.</p>
                <ServiceStatus />
              </footer>
            </div>
          </AppClientProvider>
        </MonitoringBoundary>
      </body>
    </html>
  );
}
