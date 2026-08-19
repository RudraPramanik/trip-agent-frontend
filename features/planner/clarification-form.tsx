"use client";

import { useState } from "react";
import type { components } from "@/types/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="font-medium">Quick clarification</p>
      <p className="mt-1 text-muted-foreground">{question}</p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={handleSubmit}>
        <label htmlFor="clarification_answer" className="sr-only">
          Your answer
        </label>
        <Input
          id="clarification_answer"
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={disabled}
          className="h-10"
          placeholder="Your answer"
        />
        <Button type="submit" size="sm" disabled={disabled || !answer.trim()}>
          Submit answer
        </Button>
      </form>
    </section>
  );
}
