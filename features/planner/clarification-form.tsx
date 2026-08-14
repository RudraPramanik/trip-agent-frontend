"use client";

import { useState } from "react";
import type { components } from "@/types/generated/api";
import { Button } from "@/components/ui/button";
import { buildClarificationRawInput } from "@/lib/sse/planner";

type PlanRequest = components["schemas"]["PlanRequest"];

type ClarificationFormProps = {
  question: string;
  originalRawInput: string;
  baseRequest: PlanRequest;
  disabled?: boolean;
  onSubmit: (request: PlanRequest) => void;
};

export function ClarificationForm({
  question,
  originalRawInput,
  baseRequest,
  disabled = false,
  onSubmit,
}: ClarificationFormProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      return;
    }

    onSubmit({
      ...baseRequest,
      raw_input: buildClarificationRawInput(originalRawInput, trimmed),
    });
    setAnswer("");
  };

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/40">
      <p className="font-medium">Quick clarification</p>
      <p className="mt-1 text-zinc-700 dark:text-zinc-300">{question}</p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={handleSubmit}>
        <label htmlFor="clarification_answer" className="sr-only">
          Your answer
        </label>
        <input
          id="clarification_answer"
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={disabled}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Your answer"
        />
        <Button type="submit" size="sm" disabled={disabled || !answer.trim()}>
          Submit answer
        </Button>
      </form>
    </section>
  );
}
