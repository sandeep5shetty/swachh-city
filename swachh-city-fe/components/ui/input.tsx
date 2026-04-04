import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20",
        className,
      )}
      {...props}
    />
  );
}
