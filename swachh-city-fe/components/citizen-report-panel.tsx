"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CitizenReport } from "@/types/waste";

interface CitizenReportPanelProps {
  reports: CitizenReport[];
  onSubmitReport: (
    report: Omit<CitizenReport, "id" | "createdAt" | "status">,
  ) => void;
}

const locationOptions = [
  "Indiranagar Market",
  "Ulsoor Lake",
  "Shivajinagar",
  "Frazer Town",
  "MG Road",
];

export function CitizenReportPanel({
  reports,
  onSubmitReport,
}: CitizenReportPanelProps) {
  const [location, setLocation] = useState(locationOptions[0]);
  const [description, setDescription] = useState("");
  const [imageName, setImageName] = useState("No file selected");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citizen Reporting</CardTitle>
        <CardDescription>
          Quick issue capture for residents and field volunteers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!description.trim()) {
              return;
            }

            onSubmitReport({
              location,
              description: description.trim(),
              imageName,
            });

            setDescription("");
            setImageName("No file selected");
          }}
        >
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Location</span>
            <select
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Description</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Overflowing bin near the footpath, need pickup"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5">
              <Upload className="h-4 w-4 text-cyan-300" />
              <span className="truncate">{imageName}</span>
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setImageName(file ? file.name : "No file selected");
                }}
              />
            </label>

            <Button type="submit" className="w-full sm:w-auto">
              Submit report
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Recent reports</h4>
            <Badge tone="info">{reports.length} active</Badge>
          </div>

          <div className="grid gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {report.location}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {report.description}
                    </p>
                  </div>
                  <Badge
                    tone={report.status === "Assigned" ? "warning" : "neutral"}
                  >
                    {report.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-900/80 px-2.5 py-1">
                    {report.imageName}
                  </span>
                  <span className="rounded-full bg-slate-900/80 px-2.5 py-1">
                    {report.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
