import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Stat({ value, label, tone }: { value: ReactNode; label: string; tone?: "warn" | "bad" | "good" }) {
  return (
    <div className={cn("stat", tone)}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
