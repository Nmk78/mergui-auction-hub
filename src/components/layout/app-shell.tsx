"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { buyerNavigation, sellerNavigation } from "@/lib/constants";

export function AppShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "seller" | "buyer";
}) {
  const pathname = usePathname();
  const roleLabel = variant === "seller" ? "Seller" : "Buyer";
  const navigation =
    variant === "seller" ? sellerNavigation : buyerNavigation;

  const nav = (
    <nav className="space-y-1" aria-label={`${roleLabel} navigation`}>
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
          <p className="mt-1 text-sm font-medium">Myeik Trading Co.</p>
          <p className="text-xs text-sidebar-foreground/55">{roleLabel}</p>
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
                  {roleLabel} workspace
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{nav}</div>
            </SheetContent>
          </Sheet>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="bg-background pl-9"
              placeholder="Search batches and auctions"
              aria-label="Search workspace"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">Demo User</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback>DU</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
