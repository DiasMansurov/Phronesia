import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { CookieBanner } from "@/components/site/cookie-banner";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://phronesia.org"),
  title: {
    default: "Phronesia | Economics Simulation Game for Students and Teachers",
    template: "%s | Phronesia"
  },
  description: "Phronesia is a macroeconomics simulation game for students and teachers with classroom-ready runs, teacher-managed classes, and policy trade-off gameplay.",
  applicationName: "Phronesia",
  keywords: [
    "economics game",
    "macroeconomics simulation",
    "economics classroom game",
    "economics revision game",
    "IB economics",
    "AP economics",
    "teacher classroom simulation"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "https://phronesia.org",
    title: "Phronesia | Economics Simulation Game for Students and Teachers",
    description: "Run the economy, survive the backlash, and use teacher-managed classroom flows for economics lessons and revision.",
    siteName: "Phronesia"
  },
  twitter: {
    card: "summary_large_image",
    title: "Phronesia | Economics Simulation Game",
    description: "A macroeconomics simulation game with classroom-ready teacher flows and student policy trade-off gameplay."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const content = (
    <div className="site-frame">
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {hasClerk ? (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignOutUrl="/"
            appearance={{
              variables: {
                colorPrimary: "#18b99b",
                colorBackground: "#ffffff",
                colorText: "#102236",
                borderRadius: "0.75rem"
              }
            }}
          >
            {content}
            <CookieBanner />
          </ClerkProvider>
        ) : (
          <>
            {content}
            <CookieBanner />
          </>
        )}
      </body>
    </html>
  );
}
