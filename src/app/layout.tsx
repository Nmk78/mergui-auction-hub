import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { BackendProvider } from "@/components/providers/backend-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MERGUI Auction Hub",
    template: "%s | MERGUI Auction Hub",
  },
  description:
    "AI-powered seafood quality assessment and digital auctions for Myeik's seafood trade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <BackendProvider>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </BackendProvider>
  );

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only"
        >
          Skip to main content
        </a>
        {process.env.NEXT_PUBLIC_CONVEX_URL ? (
          <ConvexAuthNextjsServerProvider>
            {content}
          </ConvexAuthNextjsServerProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
