"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { ArrowRight, Database, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBackend } from "@/components/providers/backend-provider";
import { convexApi } from "@/lib/convex-api";
import type { UserRole } from "@/types/domain";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { configured } = useBackend();

  return configured ? (
    <LiveAuthForm mode={mode} />
  ) : (
    <DemoAuthForm mode={mode} />
  );
}

function LiveAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const initializeProfile = useMutation(convexApi.profiles.initialize);
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<UserRole>(mode === "register" ? "buyer" : "seller");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("flow", mode === "register" ? "signUp" : "signIn");

    try {
      await signIn("password", data);
      if (mode === "register") {
        await initializeProfile({
          displayName: String(data.get("name") ?? "").trim(),
        });
      }
      toast.success(mode === "register" ? "Buyer account created" : "Welcome back");
      router.push(role === "seller" ? "/seller" : "/auctions");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Authentication failed. Check your details and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
            minLength={2}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Minimum 8 characters"
          minLength={8}
          required
        />
      </div>
      {mode === "login" && (
        <div className="space-y-2">
          <Label htmlFor="workspace">Open workspace</Label>
          <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
            <SelectTrigger id="workspace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">Seller workspace</SelectItem>
              <SelectItem value="buyer">Buyer marketplace</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Access is verified against your assigned account role.
          </p>
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <LockKeyhole className="size-4" />
          <AlertTitle>Could not continue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {mode === "register" ? "Create buyer account" : "Sign in securely"}
      </Button>
    </form>
  );
}

function DemoAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(mode === "register" ? "buyer" : "seller");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sessionStorage.setItem("mergui-demo-role", role);
    router.push(role === "seller" ? "/seller" : "/auctions");
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Alert>
        <Database className="size-4" />
        <AlertTitle>Local showcase mode</AlertTitle>
        <AlertDescription>
          Convex is not configured, so this form opens a seeded workspace without
          creating an account.
        </AlertDescription>
      </Alert>
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="demo-name">Full name</Label>
          <Input id="demo-name" placeholder="Your full name" required />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="demo-email">Email address</Label>
        <Input
          id="demo-email"
          type="email"
          placeholder="name@company.com"
          defaultValue="demo@mergui.trade"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="demo-password">Password</Label>
        <Input
          id="demo-password"
          type="password"
          defaultValue="demo-pass"
          required
        />
      </div>
      {mode === "login" && (
        <div className="space-y-2">
          <Label htmlFor="demo-workspace">Open workspace</Label>
          <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
            <SelectTrigger id="demo-workspace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">Seller workspace</SelectItem>
              <SelectItem value="buyer">Buyer marketplace</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button className="w-full" size="lg">
        <ArrowRight className="size-4" />
        {mode === "register" ? "Preview buyer account" : "Open showcase"}
      </Button>
    </form>
  );
}
