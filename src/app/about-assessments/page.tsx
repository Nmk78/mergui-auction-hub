import type { Metadata } from "next";
import {
  Bot,
  Camera,
  CircleDollarSign,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ASSESSMENT_DISCLAIMER,
  ASSESSMENT_LABEL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "About AI visual assessments",
};

const steps = [
  {
    icon: Camera,
    title: "Seller evidence",
    description:
      "The seller supplies batch facts and up to eight seafood photographs. The model receives only those submitted images and stored facts.",
  },
  {
    icon: Bot,
    title: "Structured visual review",
    description:
      "A hosted multimodal model returns a validated report covering visible freshness, appearance, color, damage, size consistency, and confidence.",
  },
  {
    icon: CircleDollarSign,
    title: "Trading context",
    description:
      "The report includes explained starting-bid, market-price, and export-value estimates to support—not replace—buyer judgment.",
  },
];

export default function AboutAssessmentsPage() {
  return (
    <>
      <PublicHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Transparent decision support
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            How the {ASSESSMENT_LABEL} works
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            MERGUI Auction Hub turns submitted batch images into a consistent,
            buyer-readable visual report. It keeps the source evidence, model
            output, and auction record together without presenting AI judgment
            as laboratory testing.
          </p>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <step.icon className="size-5" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle>What buyers can rely on</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>Consistent report fields validated before storage.</li>
                <li>Visible issue and confidence reporting for submitted images.</li>
                <li>Price estimates accompanied by a written explanation.</li>
                <li>A stored report that remains attached to the auction lot.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileWarning className="size-5 text-accent-foreground" />
                <CardTitle>Important limits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>The model cannot inspect smell, temperature, texture, or handling conditions not shown.</li>
                <li>Image lighting, framing, and coverage can affect the result.</li>
                <li>Buyers should still perform their normal physical and commercial checks.</li>
                <li>The assistant is restricted to facts stored in the batch report.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Alert className="mt-8">
          <FileWarning className="size-4" />
          <AlertTitle>Decision-support report</AlertTitle>
          <AlertDescription>{ASSESSMENT_DISCLAIMER}</AlertDescription>
        </Alert>
      </main>
    </>
  );
}
