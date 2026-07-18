import type { Metadata } from "next";
import { BrandMark } from "@/components/brand/brand-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthComplete } from "@/features/auth/auth-complete";

export const metadata: Metadata = {
  title: "Completing sign-in",
};

export default function AuthCompletePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8"
    >
      <div className="w-full max-w-md">
        <BrandMark className="mb-8" />
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-sm font-medium text-primary">Secure access</p>
            <CardTitle className="text-2xl">Completing sign-in</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthComplete />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
