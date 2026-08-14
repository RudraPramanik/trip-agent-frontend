"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNarrativeStore, type NarrativeDay } from "@/store/narrative";

type DayNarrativeProps = {
  tripId: string;
  dayNumber?: number;
};

function NarrativeBlock({ day }: { day: NarrativeDay }) {
  const title = day.title?.trim();
  const narrative = day.narrative?.trim();
  if (!title && !narrative) {
    return null;
  }

  return (
    <div className="space-y-1 text-sm">
      {title ? (
        <div className="font-medium [&_p]:m-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{title}</ReactMarkdown>
        </div>
      ) : null}
      {narrative ? (
        <div className="space-y-2 text-zinc-700 dark:text-zinc-300 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrative}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}

export function DayNarrative({ tripId, dayNumber }: DayNarrativeProps) {
  const payload = useNarrativeStore((state) => state.byTripId[tripId]);
  if (!payload?.days?.length) {
    return null;
  }

  const days =
    dayNumber === undefined
      ? payload.days
      : payload.days.filter((d) => d.day === dayNumber);

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <NarrativeBlock key={day.day} day={day} />
      ))}
    </div>
  );
}
