"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import {
  ArrowRight,
  Database,
  Gavel,
  Loader2,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBackend } from "@/components/providers/backend-provider";
import { convexApi } from "@/lib/convex-api";
import type { UserRole } from "@/types/domain";

export function AuthForm({
  mode,
  initialRole = "buyer",
}: {
  mode: "login" | "register";
  initialRole?: UserRole;
}) {
  const { configured } = useBackend();

  return configured ? (
    <LiveAuthForm mode={mode} initialRole={initialRole} />
  ) : (
    <DemoAuthForm mode={mode} initialRole={initialRole} />
  );
}

function LiveAuthForm({
  mode,
  initialRole,
}: {
  mode: "login" | "register";
  initialRole: UserRole;
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const initializeProfile = useMutation(convexApi.profiles.initialize);
  const [pending, setPending] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [role, setRole] = useState<UserRole>(initialRole);
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
          role,
          businessName: String(data.get("businessName") ?? "").trim() || undefined,
          primaryPort: String(data.get("primaryPort") ?? "").trim() || undefined,
        });
      }
      toast.success(
        mode === "register"
          ? `${role === "seller" ? "Seller" : "Buyer"} account created`
          : "Welcome back",
      );
      router.push(role === "seller" ? "/seller" : "/buyer");
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

  async function onGoogleSignIn() {
    setOauthPending(true);
    setError(null);
    try {
      await signIn("google", {
        redirectTo: `/auth/complete?role=${role}`,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-in failed. Try again in a moment.",
      );
      setOauthPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <RoleToggle mode={mode} role={role} onRoleChange={setRole} />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onGoogleSignIn}
        disabled={pending || oauthPending}
      >
        {oauthPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LockKeyhole className="size-4" />
        )}
        Continue with Google as {role === "seller" ? "seller" : "buyer"}
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
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
        {mode === "register" && role === "seller" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                name="businessName"
                autoComplete="organization"
                placeholder="Your seafood business"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-port">Primary landing port <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="primary-port"
                name="primaryPort"
                placeholder="e.g. Myeik Main Jetty"
              />
            </div>
          </>
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
          {mode === "register"
            ? `Create ${role === "seller" ? "seller" : "buyer"} account`
            : `Sign in as ${role === "seller" ? "seller" : "buyer"}`}
        </Button>
      </form>
    </div>
  );
}

function DemoAuthForm({
  mode,
  initialRole,
}: {
  mode: "login" | "register";
  initialRole: UserRole;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sessionStorage.setItem("mergui-demo-role", role);
    router.push(role === "seller" ? "/seller" : "/buyer");
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
      <RoleToggle mode={mode} role={role} onRoleChange={setRole} />
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
      {mode === "register" && role === "seller" && (
        <div className="space-y-2">
          <Label htmlFor="demo-business-name">Business name</Label>
          <Input id="demo-business-name" placeholder="Your seafood business" required />
        </div>
      )}
      <Button className="w-full" size="lg">
        <ArrowRight className="size-4" />
        {mode === "register"
          ? `Preview ${role} account`
          : `Open ${role} workspace`}
      </Button>
    </form>
  );
}

function RoleToggle({
  mode,
  role,
  onRoleChange,
}: {
  mode: "login" | "register";
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}) {
  const action = mode === "register" ? "I want to" : "Sign in to my";
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{action} account</legend>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        <Button
          type="button"
          variant={role === "buyer" ? "default" : "ghost"}
          className="h-auto justify-start px-3 py-2.5"
          aria-pressed={role === "buyer"}
          onClick={() => onRoleChange("buyer")}
        >
          <ShoppingBag className="size-4" />
          <span className="text-left"><span className="block">Buy seafood</span><span className="block text-xs font-normal opacity-75">Place bids</span></span>
        </Button>
        <Button
          type="button"
          variant={role === "seller" ? "default" : "ghost"}
          className="h-auto justify-start px-3 py-2.5"
          aria-pressed={role === "seller"}
          onClick={() => onRoleChange("seller")}
        >
          <Gavel className="size-4" />
          <span className="text-left"><span className="block">Sell seafood</span><span className="block text-xs font-normal opacity-75">Create auctions</span></span>
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {role === "buyer"
          ? "Buyer accounts can bid on live auctions and track purchases."
          : "Seller accounts can add batches, request assessments, and publish auctions."}
      </p>
    </fieldset>
  );
}
