"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function DevUiPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <Button>Scratch</Button>
      <Button type="button" variant="outline" onClick={() => toast("F0 scratch")}>
        F0 scratch
      </Button>
    </main>
  );
}

