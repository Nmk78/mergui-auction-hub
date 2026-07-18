import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8"
    >
      <div className="w-full max-w-md">
        <BrandMark className="mb-8" />
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-sm font-medium text-primary">Trading access</p>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Select a buyer account to place bids, or a seller account to add
              seafood batches and publish auctions.
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="register" />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="font-medium text-primary">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
