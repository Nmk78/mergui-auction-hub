"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import {
  DatabaseZap,
  Loader2,
  LogOut,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/components/providers/backend-provider";
import { convexApi } from "@/lib/convex-api";

type CleanupCounts = Record<string, number>;

type DebugStatus =
  | {
      enabled: false;
      authenticated: false;
      user: null;
      profile: null;
      wallet: null;
      records: [];
    }
  | {
      enabled: true;
      authenticated: false;
      user: null;
      profile: null;
      wallet: null;
      records: [];
    }
  | {
      enabled: true;
      authenticated: true;
      sessionId?: string | null;
      user: {
        id: string;
        name?: string;
        email?: string;
      } | null;
      profile: {
        role: "seller" | "buyer";
        displayName: string;
        businessName?: string;
      } | null;
      wallet: {
        balance: number;
        reserved: number;
        available: number;
      } | null;
      records: Array<{
        label: string;
        count: number;
        limited: boolean;
      }>;
    };

const debugToolEnabled = process.env.NEXT_PUBLIC_DEBUG_TOOLS_ENABLED === "true";

export function DebugTools() {
  const { configured } = useBackend();

  if (!debugToolEnabled) {
    return null;
  }

  if (!configured) {
    return <LocalDebugTools />;
  }

  return <LiveDebugTools />;
}

function LocalDebugTools() {
  const router = useRouter();

  function clearShowcaseSession() {
    sessionStorage.removeItem("mergui-demo-role");
    toast.success("Showcase session cleared");
    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Showcase storage</CardTitle>
        <CardDescription>
          Convex is not configured, so only browser showcase state is available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={clearShowcaseSession}>
          <LogOut className="size-4" />
          Clear showcase session
        </Button>
      </CardContent>
    </Card>
  );
}

function LiveDebugTools() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const status = useQuery(convexApi.debug.status, {}) as DebugStatus | undefined;
  const clearCurrentSession = useMutation(convexApi.debug.clearCurrentSession);
  const clearAllSessions = useMutation(convexApi.debug.clearAllSessions);
  const resetCurrentUserData = useMutation(convexApi.debug.resetCurrentUserData);
  const deleteCurrentAccount = useMutation(convexApi.debug.deleteCurrentAccount);
  const clearAuthRateLimit = useMutation(convexApi.debug.clearAuthRateLimit);
  const [pending, setPending] = useState<string | null>(null);
  const [rateLimitIdentifier, setRateLimitIdentifier] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const accountConfirmation = status?.authenticated
    ? status.user?.email ?? "DELETE"
    : "DELETE";

  async function runTool(
    key: string,
    label: string,
    operation: () => Promise<CleanupCounts>,
    options: { signOutAfter?: boolean } = {},
  ) {
    setPending(key);
    try {
      const counts = await operation();
      toast.success(`${label} complete`, {
        description: summarizeCounts(counts),
      });
      if (options.signOutAfter) {
        await signOut();
        router.push("/login");
      }
      router.refresh();
    } catch (cause) {
      toast.error(label, {
        description:
          cause instanceof Error ? cause.message : "The debug action failed.",
      });
    } finally {
      setPending(null);
    }
  }

  async function clearRateLimit() {
    await runTool("rate-limit", "Rate limit cleared", () =>
      clearAuthRateLimit({ identifier: rateLimitIdentifier }),
    );
    setRateLimitIdentifier("");
  }

  if (status === undefined) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-lg border">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status.enabled) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="size-4" />
        <AlertTitle>Convex debug flag is off</AlertTitle>
        <AlertDescription>
          Set `DEBUG_TOOLS_ENABLED=true` in the Convex deployment before using
          these tools.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Current auth state</CardTitle>
            <CardDescription>
              The cleanup actions operate on the signed-in Convex Auth user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!status.authenticated ? (
              <Alert>
                <ShieldAlert className="size-4" />
                <AlertTitle>No active account</AlertTitle>
                <AlertDescription>
                  Sign in first to inspect or delete account-owned records.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <Fact label="Email" value={status.user?.email ?? "No email"} />
                <Fact
                  label="Profile"
                  value={status.profile?.businessName ?? status.profile?.displayName ?? "None"}
                />
                <Fact
                  label="Role"
                  value={status.profile?.role ?? "Uninitialized"}
                  badge
                />
              </div>
            )}
          </CardContent>
        </Card>

        {status.authenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Related records</CardTitle>
              <CardDescription>
                Counts are capped for safety in large development datasets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.records.map((record) => (
                    <TableRow key={record.label}>
                      <TableCell>{record.label}</TableCell>
                      <TableCell className="text-right">
                        {record.count}
                        {record.limited ? "+" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Session cleanup</CardTitle>
            <CardDescription>
              Remove the browser session or every session attached to this user.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              variant="outline"
              disabled={!status.authenticated || pending !== null}
              onClick={() =>
                runTool(
                  "current-session",
                  "Current session cleared",
                  () => clearCurrentSession({}),
                  { signOutAfter: true },
                )
              }
            >
              {pending === "current-session" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Clear current session
            </Button>
            <Button
              variant="outline"
              disabled={!status.authenticated || pending !== null}
              onClick={() =>
                runTool(
                  "all-sessions",
                  "All sessions cleared",
                  () => clearAllSessions({}),
                  { signOutAfter: true },
                )
              }
            >
              {pending === "all-sessions" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}
              Clear all sessions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account cleanup</CardTitle>
            <CardDescription>
              Remove marketplace data while keeping auth, or delete the account
              and its auth records.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!status.authenticated || pending !== null}
                >
                  <DatabaseZap className="size-4" />
                  Reset my app data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <DatabaseZap className="size-5" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Reset app data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes this user&apos;s profile, wallet, batches,
                    assessments, bids, transactions, and related logs. Type
                    `RESET` to continue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={resetConfirm}
                  onChange={(event) => setResetConfirm(event.target.value)}
                  placeholder="RESET"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={resetConfirm !== "RESET" || pending !== null}
                    onClick={() => {
                      setResetConfirm("");
                      void runTool("reset-data", "App data reset", () =>
                        resetCurrentUserData({}),
                      );
                    }}
                  >
                    Reset data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={!status.authenticated || pending !== null}
                >
                  <UserX className="size-4" />
                  Delete current account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2 className="size-5" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the signed-in user, auth sessions, auth
                    accounts, and marketplace records. Type
                    ` {accountConfirmation} ` to continue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder={accountConfirmation}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={
                      deleteConfirm !== accountConfirmation || pending !== null
                    }
                    onClick={() => {
                      setDeleteConfirm("");
                      void runTool(
                        "delete-account",
                        "Account deleted",
                        () => deleteCurrentAccount({}),
                        { signOutAfter: true },
                      );
                    }}
                  >
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth rate limit</CardTitle>
            <CardDescription>
              Clear a password or OTP lockout by email or raw identifier.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate-limit-identifier">Identifier</Label>
              <Input
                id="rate-limit-identifier"
                value={rateLimitIdentifier}
                onChange={(event) => setRateLimitIdentifier(event.target.value)}
                placeholder="buyer@example.com"
              />
            </div>
            <Button
              variant="outline"
              disabled={!rateLimitIdentifier.trim() || pending !== null}
              onClick={() => void clearRateLimit()}
            >
              {pending === "rate-limit" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldAlert className="size-4" />
              )}
              Clear rate limit
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Fact({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 min-h-6">
        {badge ? (
          <Badge variant="outline">{value}</Badge>
        ) : (
          <p className="truncate text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

function summarizeCounts(counts: CleanupCounts) {
  const changed = Object.entries(counts).filter(([, count]) => count > 0);
  if (changed.length === 0) {
    return "No records changed.";
  }
  return changed
    .slice(0, 4)
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ");
}
