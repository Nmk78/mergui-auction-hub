import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PublicHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/auctions" className="text-foreground">
            Live auctions
          </Link>
          <Link href="/auctions?status=scheduled" className="text-muted-foreground">
            Upcoming
          </Link>
          <Link href="/about-assessments" className="text-muted-foreground">
            AI assessments
          </Link>
        </nav>
        <form
          action="/auctions"
          className="relative ml-auto hidden w-64 lg:block"
          role="search"
        >
          <button
            type="submit"
            className="absolute left-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search seafood auctions"
          >
            <Search className="size-4" />
          </button>
          <Input
            name="search"
            className="bg-background pl-9"
            placeholder="Search seafood"
            aria-label="Search seafood"
          />
        </form>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto md:hidden"
              aria-label="Open public navigation"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Explore MERGUI</SheetTitle>
              <SheetDescription>
                Browse assessed seafood and learn how visual reports work.
              </SheetDescription>
            </SheetHeader>
            <nav className="grid gap-2 px-4" aria-label="Public mobile navigation">
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/auctions">Live auctions</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/auctions?status=scheduled">Upcoming auctions</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start">
                <Link href="/about-assessments">AI assessments</Link>
              </Button>
            </nav>
            <form action="/auctions" className="px-4" role="search">
              <label
                htmlFor="mobile-seafood-search"
                className="mb-2 block text-sm font-medium"
              >
                Search seafood
              </label>
              <div className="flex gap-2">
                <Input
                  id="mobile-seafood-search"
                  name="search"
                  placeholder="e.g. shrimp"
                />
                <Button type="submit" size="icon" aria-label="Search">
                  <Search className="size-4" />
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        <Button variant="ghost" asChild className="md:ml-auto lg:ml-0">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/register">Buyer registration</Link>
        </Button>
      </div>
    </header>
  );
}
