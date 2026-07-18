"use client";

import { useAction, useQuery } from "convex/react";
import {
  AlertCircle,
  BadgeCheck,
  Bot,
  CircleDollarSign,
  Loader2,
  MessageSquareText,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useBackend } from "@/components/providers/backend-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ASSESSMENT_DISCLAIMER,
  ASSESSMENT_LABEL,
  mmk,
} from "@/lib/constants";
import { convexApi } from "@/lib/convex-api";
import { demoAssessments } from "@/lib/demo-data";
import type { Assessment, BatchSummary } from "@/types/domain";

type StoredAssessment = Partial<Assessment> & {
  _id?: string;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
};

export function AssessmentPanel({ batch }: { batch: BatchSummary }) {
  const { configured } = useBackend();
  if (!configured) {
    const assessment = demoAssessments.find((item) => item.batchId === batch.id);
    return (
      <AssessmentView
        batch={batch}
        assessment={
          assessment ? { ...assessment, status: "completed" } : null
        }
        onRequest={async () => {
          await new Promise((resolve) => window.setTimeout(resolve, 650));
          toast.success("Showcase assessment generated");
        }}
        onAsk={(question) => Promise.resolve(demoAnswer(assessment, question))}
      />
    );
  }
  return <LiveAssessmentPanel batch={batch} />;
}

function LiveAssessmentPanel({ batch }: { batch: BatchSummary }) {
  const result = useQuery(convexApi.assessments.getForBatch, {
    batchId: batch.id,
  });
  const requestAssessment = useAction(convexApi.assessments.request);
  const askAssistant = useAction(convexApi.assessments.ask);

  if (result === undefined) {
    return <AssessmentSkeleton />;
  }

  return (
    <AssessmentView
      batch={batch}
      assessment={result as StoredAssessment | null}
      onRequest={() => requestAssessment({ batchId: batch.id })}
      onAsk={(question) =>
        askAssistant({ batchId: batch.id, question }) as Promise<string>
      }
    />
  );
}

function AssessmentView({
  batch,
  assessment,
  onRequest,
  onAsk,
}: {
  batch: BatchSummary;
  assessment: StoredAssessment | null;
  onRequest: () => Promise<unknown>;
  onAsk: (question: string) => Promise<string>;
}) {
  const [requesting, setRequesting] = useState(false);

  async function request() {
    setRequesting(true);
    try {
      await onRequest();
      toast.success("AI visual assessment completed");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "The AI assessment could not be completed.",
      );
    } finally {
      setRequesting(false);
    }
  }

  if (assessment?.status === "pending" || requesting) {
    return (
      <Card id="assessment">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <h2 className="mt-5 text-lg font-semibold">Analyzing batch images</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The hosted vision model is reviewing visible freshness, appearance,
            color, damage, and size consistency.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!assessment || assessment.status === "failed") {
    const hasImages = batch.images.length > 0;
    return (
      <Card id="assessment">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle>{ASSESSMENT_LABEL}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assessment?.errorMessage && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="size-4" />
              <AlertTitle>Previous assessment failed</AlertTitle>
              <AlertDescription>{assessment.errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg border border-dashed bg-muted/25 px-6 py-10 text-center">
            <Bot className="mx-auto size-8 text-primary" />
            <h3 className="mt-4 font-semibold">
              {hasImages ? "Ready for visual review" : "Photos are required"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              {hasImages
                ? "Generate the quality score, decision-support grade, price estimate, visible issues, and buyer-facing explanation."
                : "Upload at least one clear seafood image before requesting the assessment."}
            </p>
            <Button className="mt-5" disabled={!hasImages} onClick={request}>
              <Sparkles className="size-4" />
              Run AI visual assessment
            </Button>
          </div>
          <AssessmentDisclaimer className="mt-5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="assessment" className="space-y-6">
      <AssessmentReport assessment={assessment as Assessment} />
      <AssistantCard onAsk={onAsk} />
    </div>
  );
}

export function AssessmentReport({
  assessment,
  publicView = false,
}: {
  assessment: Assessment;
  publicView?: boolean;
}) {
  const metrics = [
    ["Freshness", assessment.freshness],
    ["Appearance", assessment.appearance],
    ["Color", assessment.color],
    ["Low visible damage", assessment.damage],
    ["Size consistency", assessment.sizeConsistency],
  ] as const;

  return (
    <Card>
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-primary" />
              <CardTitle>{ASSESSMENT_LABEL}</CardTitle>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Model confidence {assessment.confidence.toFixed(0)}%
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/25 bg-primary/8 px-3 py-1 text-primary">
            {assessment.grade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-7 pt-6">
        <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg bg-secondary text-center">
            <span className="font-mono text-5xl font-semibold tracking-tight text-primary">
              {assessment.qualityScore.toFixed(1)}
            </span>
            <span className="mt-1 text-sm font-medium text-muted-foreground">
              out of 10
            </span>
            <span className="mt-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Visual quality
            </span>
          </div>
          <div className="space-y-4">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-medium">{value.toFixed(1)}</span>
                </div>
                <Progress value={value * 10} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Assessment summary</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {assessment.summary}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Trading recommendation</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {assessment.recommendation}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Detected visible issues</h3>
          {assessment.detectedIssues.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No material visible issues were returned for the submitted images.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {assessment.detectedIssues.map((issue) => (
                <li
                  key={issue}
                  className="flex gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm text-muted-foreground"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <CircleDollarSign className="size-5 text-primary" />
            <h3 className="font-semibold">AI price estimate</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <PriceMetric
              label="Suggested starting bid"
              value={assessment.suggestedStartingBid}
            />
            <PriceMetric
              label="Suggested market price"
              value={assessment.suggestedMarketPrice}
            />
            <PriceMetric
              label="Estimated export value"
              value={assessment.estimatedExportValue}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {assessment.priceExplanation}
          </p>
        </div>

        <AssessmentDisclaimer />
        {!publicView && (
          <p className="text-xs text-muted-foreground">
            Processed by {assessment.model} on{" "}
            {new Date(assessment.completedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PriceMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-4">
      <p className="text-xs leading-5 text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold">{mmk.format(value)}</p>
    </div>
  );
}

function AssistantCard({
  onAsk,
}: {
  onAsk: (question: string) => Promise<string>;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = question.trim();
    if (normalized.length < 3) {
      return;
    }
    setPending(true);
    try {
      setAnswer(await onAsk(normalized));
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "The assistant could not answer.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-primary" />
          <CardTitle>AI seafood assistant</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask for an explanation of the stored report. Answers cannot use facts
          outside this assessment.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder='e.g. "What makes this Export Grade?"'
            maxLength={500}
          />
          <Button type="submit" size="icon" disabled={pending || question.trim().length < 3}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span className="sr-only">Ask assistant</span>
          </Button>
        </form>
        {answer && (
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm leading-7 text-foreground">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AssessmentDisclaimer({ className }: { className?: string }) {
  return (
    <Alert className={className}>
      <ShieldAlert className="size-4" />
      <AlertTitle>Decision-support report</AlertTitle>
      <AlertDescription>{ASSESSMENT_DISCLAIMER}</AlertDescription>
    </Alert>
  );
}

function AssessmentSkeleton() {
  return (
    <Card id="assessment">
      <CardContent className="space-y-5 py-6">
        <Skeleton className="h-7 w-1/3" />
        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <Skeleton className="h-40" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function demoAnswer(assessment: Assessment | undefined, question: string) {
  if (!assessment) {
    return "That information is not available in this stored assessment.";
  }
  const normalized = question.toLowerCase();
  if (normalized.includes("price") || normalized.includes("value")) {
    return assessment.priceExplanation;
  }
  if (
    normalized.includes("defect") ||
    normalized.includes("issue") ||
    normalized.includes("damage")
  ) {
    return assessment.detectedIssues.length
      ? `The stored AI visual assessment identified: ${assessment.detectedIssues.join("; ")}.`
      : "The stored assessment did not record material visible issues.";
  }
  if (normalized.includes("grade") || normalized.includes("export")) {
    return `${assessment.summary} The stored recommendation says: ${assessment.recommendation}`;
  }
  return assessment.summary;
}
