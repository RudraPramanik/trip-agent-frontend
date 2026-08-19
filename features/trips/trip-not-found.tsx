"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TripNotFound() {
  return (
    <Card className="w-full max-w-lg" role="alert">
      <CardHeader>
        <CardTitle>Trip not found</CardTitle>
        <CardDescription>
          This trip id is missing or unknown. Generate a trip or check the link.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
