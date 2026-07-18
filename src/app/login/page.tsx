import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.7fr)]"
    >
      <section className="hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col">
        <BrandMark className="[&_span:last-child_span:last-child]:text-sidebar-foreground/60" />
        <div className="my-auto max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
            Myeik seafood trading
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Quality evidence and auction activity in one operating workspace.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-foreground/66">
            Assess a landed batch, publish it to verified buyers, and retain the
            complete trading record.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-sidebar-foreground/75">
            <ShieldCheck className="size-5 text-sidebar-primary" />
            Role-controlled seller and buyer access
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/40">
          AI visual reports support trading decisions. They are not official
          certifications.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BrandMark className="mb-10 lg:hidden" />
          <Card className="shadow-sm">
            <CardHeader>
              <p className="text-sm font-medium text-primary">Secure access</p>
              <CardTitle className="text-2xl">Sign in to your workspace</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Choose whether you are here to buy seafood or sell it, then sign in to the matching workspace.
              </p>
            </CardHeader>
            <CardContent>
              <AuthForm mode="login" />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/register" className="font-medium text-primary">
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
