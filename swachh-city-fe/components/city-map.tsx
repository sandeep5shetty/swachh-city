import { AlertTriangle, Truck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Hotspot, WasteBin, WasteTruck } from "@/types/waste";

interface CityMapProps {
  bins: WasteBin[];
  trucks: WasteTruck[];
  hotspots: Hotspot[];
  routePoints: Array<{ x: number; y: number }>;
  onSelectBin: (bin: WasteBin) => void;
}

function getBinTone(fillLevel: number) {
  if (fillLevel < 40) {
    return { tone: "success" as const, label: "Green" };
  }

  if (fillLevel < 80) {
    return { tone: "warning" as const, label: "Yellow" };
  }

  return { tone: "danger" as const, label: "Red" };
}

export function CityMap({
  bins,
  trucks,
  hotspots,
  routePoints,
  onSelectBin,
}: CityMapProps) {
  const routePath = routePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="relative overflow-hidden border-b border-white/10 pb-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.15),_transparent_34%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <CardTitle>Digital Twin Map</CardTitle>
            <CardDescription>
              Live waste activity across Bangalore East Cluster with bins,
              trucks, and hotspots.
            </CardDescription>
          </div>
          <Badge tone="info">Real-time simulation</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="relative min-h-[560px] overflow-hidden bg-slate-950/80 p-4 sm:p-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:60px_60px] opacity-45" />
            <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute right-10 bottom-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative h-[500px] rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.94))] p-4 shadow-2xl shadow-black/30">
              <div className="absolute inset-4 rounded-[24px] border border-white/5 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.07),transparent_55%)]" />

              <svg
                className="absolute inset-0 h-full w-full p-4"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="route-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <polyline
                  points={routePath}
                  fill="none"
                  stroke="url(#route-gradient)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1.8 1.2"
                  opacity="0.9"
                />
              </svg>

              {hotspots.map((hotspot) => (
                <div
                  key={hotspot.id}
                  className="absolute rounded-full border border-rose-300/20 bg-rose-500/10 shadow-[0_0_0_1px_rgba(244,63,94,0.18)]"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: hotspot.size * 10,
                    height: hotspot.size * 10,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="absolute inset-[20%] animate-ping rounded-full bg-rose-400/25" />
                  <div className="absolute inset-[30%] rounded-full border border-rose-300/40 bg-rose-400/30" />
                  <div className="absolute -bottom-8 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/90 px-2 py-1 text-[10px] text-slate-200">
                    {hotspot.label}
                  </div>
                </div>
              ))}

              {bins.map((bin) => {
                const tone = getBinTone(bin.fillLevel);
                return (
                  <Button
                    key={bin.id}
                    type="button"
                    variant="ghost"
                    className="absolute h-14 w-14 rounded-2xl border border-white/10 bg-slate-900/80 p-0 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.9)] hover:-translate-y-1 hover:bg-slate-800/90"
                    style={{
                      left: `${bin.x}%`,
                      top: `${bin.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => onSelectBin(bin)}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-[11px] font-semibold ${tone.tone === "success" ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" : tone.tone === "warning" ? "border-amber-400/30 bg-amber-400/15 text-amber-300" : "border-rose-400/30 bg-rose-400/15 text-rose-300"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <span className="absolute -bottom-10 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-2.5 py-1 text-[10px] text-slate-200 shadow-lg">
                      {bin.name}
                    </span>
                  </Button>
                );
              })}

              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  className="absolute flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_18px_50px_-20px_rgba(34,211,238,0.65)] transition-all duration-700"
                  style={{
                    left: `${truck.x}%`,
                    top: `${truck.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Truck className="h-5 w-5" />
                  <div className="absolute -right-2 -top-2 rounded-full border border-white/10 bg-slate-950 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-slate-300">
                    {truck.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-slate-950/60 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Map intelligence
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Route overlays connect priority bins while hotspot rings show
                  areas where citizen complaints and overflow are concentrated.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <AlertTriangle className="h-4 w-4 text-rose-300" />
                    Priority bins
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Bins above 80% auto-mark as red and enter the truck routing
                    queue.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Truck className="h-4 w-4 text-cyan-300" />
                    Moving fleet
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Trucks hop between assigned checkpoints to simulate live
                    field operations.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Trash2 className="h-4 w-4 text-emerald-300" />
                    Bin legend
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge tone="success">0-40% clean</Badge>
                    <Badge tone="warning">40-80% watch</Badge>
                    <Badge tone="danger">80-100% urgent</Badge>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
