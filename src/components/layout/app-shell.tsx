"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Plus, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { useBackend } from "@/components/providers/backend-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { convexApi } from "@/lib/convex-api";
import { cn } from "@/lib/utils";
import { buyerNavigation, sellerNavigation } from "@/lib/constants";

type WorkspaceVariant = "seller" | "buyer";
type CurrentProfileResult = {
  user: { name?: string; email?: string } | null;
  profile: {
    role: WorkspaceVariant;
    displayName: string;
    businessName?: string;
  } | null;
};

export function AppShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: WorkspaceVariant;
}) {
  const { configured } = useBackend();

  if (configured) {
    return <LiveAppShell variant={variant}>{children}</LiveAppShell>;
  }

  return (
    <ShellFrame
      variant={variant}
      identity={<Identity name="Showcase User" roleLabel={roleLabel(variant)} />}
    >
      {children}
    </ShellFrame>
  );
}

function LiveAppShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: WorkspaceVariant;
}) {
  const router = useRouter();
  const result = useQuery(convexApi.profiles.current, {}) as
    | CurrentProfileResult
    | undefined;
  const actualRole = result?.profile?.role;
  const roleMismatch = Boolean(actualRole && actualRole !== variant);

  useEffect(() => {
    if (!actualRole || actualRole === variant) {
      return;
    }
    router.replace(actualRole === "seller" ? "/seller" : "/buyer");
  }, [actualRole, router, variant]);

  const guardedChildren =
    result === undefined ? (
      <WorkspaceLoading />
    ) : roleMismatch ? (
      <WorkspaceRedirecting actualRole={actualRole} />
    ) : !result.profile ? (
      <WorkspaceProfileMissing variant={variant} />
    ) : (
      children
    );

  return (
    <ShellFrame
      variant={variant}
      identity={
        result === undefined ? (
          <Skeleton className="size-9 rounded-full" />
        ) : (
          <WorkspaceIdentity result={result} roleLabel={roleLabel(variant)} />
        )
      }
    >
      {guardedChildren}
    </ShellFrame>
  );
}

function ShellFrame({
  children,
  variant,
  identity,
}: {
  children: React.ReactNode;
  variant: WorkspaceVariant;
  identity: React.ReactNode;
}) {
  const pathname = usePathname();
  const label = roleLabel(variant);
  const navigation =
    variant === "seller" ? sellerNavigation : buyerNavigation;

  const nav = (
    <nav className="space-y-1" aria-label={`${label} navigation`}>
      {navigation.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/seller" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex h-20 items-center px-6">
          <BrandMark className="[&_span:last-child_span:last-child]:text-sidebar-foreground/60" />
        </div>
        <Separator className="bg-sidebar-border" />
        <div className="flex-1 px-4 py-6">{nav}</div>
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-sidebar-foreground/45">
            Workspace
          </p>
          <p className="mt-1 text-sm font-medium">MERGUI Auction Hub</p>
          <p className="text-xs text-sidebar-foreground/55">{label}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground">
              <SheetHeader className="text-left">
                <SheetTitle className="text-sidebar-foreground">
                  <BrandMark />
                </SheetTitle>
                <SheetDescription className="text-sidebar-foreground/60">
                  {label} workspace
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{nav}</div>
            </SheetContent>
          </Sheet>

          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link
              href={variant === "seller" ? "/seller/batches/new" : "/auctions"}
            >
              {variant === "seller" ? (
                <Plus className="size-4" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              {variant === "seller" ? "Create batch" : "Browse auctions"}
            </Link>
          </Button>
          <div className="ml-auto flex items-center gap-3">
            {identity}
          </div>
        </header>
        <main
          id="main-content"
          className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function WorkspaceIdentity({
  result,
  roleLabel,
}: {
  result: CurrentProfileResult;
  roleLabel: string;
}) {
  const name =
    result.profile?.businessName ??
    result.profile?.displayName ??
    result.user?.name ??
    "Account";
  return <Identity name={name} roleLabel={roleLabel} />;
}

function Identity({ name, roleLabel }: { name: string; roleLabel: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <>
      <div className="hidden max-w-48 text-right sm:block">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>
      <Avatar className="size-9">
        <AvatarFallback>{initials || "MA"}</AvatarFallback>
      </Avatar>
    </>
  );
}

function WorkspaceLoading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-9 w-52" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function WorkspaceRedirecting({
  actualRole,
}: {
  actualRole: WorkspaceVariant | undefined;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium">Opening your workspace</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This account is registered as {actualRole === "seller" ? "a seller" : "a buyer"}.
      </p>
    </div>
  );
}

function WorkspaceProfileMissing({ variant }: { variant: WorkspaceVariant }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium">Trading profile required</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This signed-in account does not have an initialized {roleLabel(variant).toLowerCase()} profile.
      </p>
      {variant === "buyer" && (
        <Button asChild className="mt-4">
          <Link href="/auth/complete?role=buyer">Complete buyer profile</Link>
        </Button>
      )}
    </div>
  );
}

function roleLabel(variant: WorkspaceVariant) {
  return variant === "seller" ? "Seller" : "Buyer";
}
