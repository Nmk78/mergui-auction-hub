import Link from "next/link";
import { Search } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PublicHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/auctions" className="text-foreground">
            Live auctions
          </Link>
          <Link href="/auctions?status=upcoming" className="text-muted-foreground">
            Upcoming
          </Link>
          <Link href="/about-assessments" className="text-muted-foreground">
            AI assessments
          </Link>
        </nav>
        <div className="relative ml-auto hidden w-64 lg:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-background pl-9"
            placeholder="Search seafood"
            aria-label="Search seafood"
          />
        </div>
        <Button variant="ghost" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Buyer registration</Link>
        </Button>
      </div>
    </header>
  );
}
