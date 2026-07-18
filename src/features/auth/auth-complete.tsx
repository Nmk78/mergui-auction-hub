"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { convexApi } from "@/lib/convex-api";
import type { UserRole } from "@/types/domain";

type EnsureProfileResult = {
  profileId: string;
  role: UserRole;
};

export function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureProfile = useMutation(convexApi.profiles.ensureProfile);
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || started.current) {
      return;
    }
    started.current = true;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    void (async () => {
      try {
        const requestedRole =
          searchParams.get("role") === "seller" ? "seller" : "buyer";
        const result = (await ensureProfile({
          role: requestedRole,
        })) as EnsureProfileResult;
        const destination = result.role === "seller" ? "/seller" : "/buyer";
        router.replace(destination);
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not finish Google sign-in.",
        );
      }
    })();
  }, [ensureProfile, isAuthenticated, isLoading, router, searchParams]);

  return (
    <div className="space-y-5 text-center">
      {error ? (
        <>
          <Alert variant="destructive" className="text-left">
            <LockKeyhole className="size-4" />
            <AlertTitle>Could not finish sign-in</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => router.replace("/login")}>
            Back to sign in
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Finishing secure sign-in...
          </p>
        </>
      )}
    </div>
  );
}
