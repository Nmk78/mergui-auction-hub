"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useBackend } from "@/components/providers/backend-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";

type CurrentProfileResult = {
  profile: {
    role: "seller" | "buyer";
  } | null;
};

export function PublicHeaderAuthActions() {
  const { configured } = useBackend();

  if (!configured) {
    return <GuestActions />;
  }

  return <LivePublicHeaderAuthActions />;
}

function LivePublicHeaderAuthActions() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [pending, startTransition] = useTransition();
  const result = useQuery(
    convexApi.profiles.current,
    isAuthenticated ? {} : "skip",
  ) as CurrentProfileResult | undefined;

  if (isLoading || (isAuthenticated && result === undefined)) {
    return (
      <div className="flex items-center gap-2 md:ml-auto lg:ml-0">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="hidden h-9 w-36 sm:block" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GuestActions />;
  }

  const role = result?.profile?.role;
  const workspaceHref = role === "seller" ? "/seller" : "/buyer";
  const workspaceLabel =
    role === "seller"
      ? "Seller workspace"
      : role === "buyer"
        ? "Buyer workspace"
        : "Complete profile";

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 md:ml-auto lg:ml-0">
      <Button variant="ghost" asChild>
        <Link href={role ? workspaceHref : "/auth/complete?role=buyer"}>
          {workspaceLabel}
        </Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleSignOut}
        disabled={pending}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

function GuestActions() {
  return (
    <>
      <Button variant="ghost" asChild className="md:ml-auto lg:ml-0">
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild className="hidden sm:inline-flex">
        <Link href="/register">Buyer registration</Link>
      </Button>
    </>
  );
}
