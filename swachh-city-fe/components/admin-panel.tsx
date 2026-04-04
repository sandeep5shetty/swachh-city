import { Activity, AlertTriangle, MapPinned, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CitizenReport, WasteTruck } from "@/types/waste";

interface AdminPanelProps {
  counts: {
    empty: number;
    medium: number;
    full: number;
  };
  trucks: WasteTruck[];
  reports: CitizenReport[];
}

const loadBars = [18, 42, 66, 30, 84, 56, 28];

export function AdminPanel({ counts, trucks, reports }: AdminPanelProps) {
  const totalBins = counts.empty + counts.medium + counts.full;

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-white/10">
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>
          Operational snapshot for ward managers and field coordinators.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <MapPinned className="h-4 w-4" />
              Empty
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">
              {counts.empty}
            </p>
            <p className="mt-1 text-xs text-slate-400">Under 40% fill</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Activity className="h-4 w-4" />
              Medium
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">
              {counts.medium}
            </p>
            <p className="mt-1 text-xs text-slate-400">Between 40% and 80%</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              Full
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">
              {counts.full}
            </p>
            <p className="mt-1 text-xs text-slate-400">Priority pickups</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Truck status</h4>
              <p className="text-xs text-slate-400">
                Active routes are switching every simulation tick.
              </p>
            </div>
            <Badge tone="info">{trucks.length} fleet</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {trucks.map((truck) => (
              <div
                key={truck.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {truck.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Capacity {truck.capacity}
                    </p>
                  </div>
                </div>
                <Badge
                  tone={
                    truck.status === "servicing"
                      ? "warning"
                      : truck.status === "idle"
                        ? "neutral"
                        : "success"
                  }
                >
                  {truck.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Complaint summary
              </h4>
              <p className="text-xs text-slate-400">
                Citizen reports are feeding the dispatch queue.
              </p>
            </div>
            <Badge tone="neutral">{reports.length} reports</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {reports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-white/10 bg-slate-950/60 p-3"
              >
                <p className="text-sm font-medium text-white">
                  {report.location}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                  {report.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-linear-to-r from-cyan-500/10 to-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Fleet efficiency
              </h4>
              <p className="text-xs text-slate-400">
                Simplified occupancy view across the current map state.
              </p>
            </div>
            <Badge tone="info">{totalBins} bins</Badge>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {loadBars.map((value, index) => (
              <div
                key={index}
                className="flex h-24 items-end rounded-xl border border-white/10 bg-slate-950/50 p-1"
              >
                <div
                  className="w-full rounded-lg bg-linear-to-t from-cyan-400 to-emerald-300"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
