import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-white/8 text-slate-200 border-white/10",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  warning: "bg-amber-500/15 text-amber-300 border-amber-400/20",
  danger: "bg-rose-500/15 text-rose-300 border-rose-400/20",
  info: "bg-cyan-500/15 text-cyan-300 border-cyan-400/20",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
