import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { CookieBanner } from "@/components/site/cookie-banner";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://phronesia.org"),
  title: {
    default: "Phronesia | Finance & Economics Education Through Simulation",
    template: "%s | Phronesia"
  },
  description: "Phronesia is a finance and economics education platform where students learn markets, money, debt, risk, and policy through simulation-based decisions.",
  applicationName: "Phronesia",
  keywords: [
    "finance education platform",
    "financial literacy simulator",
    "economics simulation",
    "finance classroom game",
    "market simulation",
    "student finance learning",
    "teacher classroom simulation",
    "investment education"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "https://phronesia.org",
    title: "Phronesia | Finance & Economics Education Through Simulation",
    description: "Learn savings, loans, markets, bonds, currency, banking stability, debt, and policy through interactive simulation.",
    siteName: "Phronesia"
  },
  twitter: {
    card: "summary_large_image",
    title: "Phronesia | Finance Simulation Platform",
    description: "A finance and economics simulation platform for students, teachers, competitions, and self-study."
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
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
