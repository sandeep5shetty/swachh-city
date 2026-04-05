"use client";

import {
  Activity,
  ArrowRight,
  Bell,
  Boxes,
  Cpu,
  Eye,
  Gauge,
  Map,
  Settings,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardStats = {
  bins: {
    total: number;
    active: number;
    inactive: number;
    critical: number;
    onlinePercentage: string;
  };
  trucks: {
    active: number;
    total: number;
  };
  complaints: {
    unresolved: number;
  };
};

type CollectionStats = {
  totalWaste: number;
};

type TodayStats = {
  binsCollected: number;
  complaintsToday: number;
  activeTrucks: number;
};

type OpenDataState = {
  dashboard: DashboardStats;
  collection: CollectionStats;
  today: TodayStats;
};

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

const defaultOpenData: OpenDataState = {
  dashboard: {
    bins: {
      total: 0,
      active: 0,
      inactive: 0,
      critical: 0,
      onlinePercentage: "0%",
    },
    trucks: {
      active: 0,
      total: 0,
    },
    complaints: {
      unresolved: 0,
    },
  },
  collection: {
    totalWaste: 0,
  },
  today: {
    binsCollected: 0,
    complaintsToday: 0,
    activeTrucks: 0,
  },
};

async function fetchPublicStats<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 py-10 sm:px-10">
      <p className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

export function LandingPage() {
  const [openData, setOpenData] = useState<OpenDataState>(defaultOpenData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [dashboard, collection, today] = await Promise.all([
          fetchPublicStats<DashboardStats>("/api/stats"),
          fetchPublicStats<CollectionStats>("/api/stats/collection"),
          fetchPublicStats<TodayStats>("/api/stats/today"),
        ]);

        if (!ignore) {
          setOpenData({ dashboard, collection, today });
        }
      } catch {
        if (!ignore) {
          setOpenData(defaultOpenData);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const rows = useMemo(() => {
    const critical = openData.dashboard.bins.critical;
    const warning = Math.max(
      0,
      openData.dashboard.complaints.unresolved - openData.today.complaintsToday,
    );
    const healthy = Math.max(0, openData.dashboard.bins.active - critical);

    return [
      {
        id: "BIN-KRM-042",
        location: "Koramangala 4th Block",
        status: critical > 0 ? "Critical" : "Optimal",
        fill: `${Math.min(100, 80 + critical * 4)}%`,
        action: critical > 0 ? "Route diversion required" : "Monitoring",
      },
      {
        id: "BIN-IND-118",
        location: "Indiranagar 100ft Rd",
        status: warning > 0 ? "Warning" : "Optimal",
        fill: `${Math.min(100, 60 + warning * 3)}%`,
        action: warning > 0 ? "Scheduled dispatch" : "Monitoring",
      },
      {
        id: "BIN-JYN-005",
        location: "Jayanagar 4th T Block",
        status: healthy > 0 ? "Optimal" : "Warning",
        fill: `${Math.max(20, 42 - warning)}%`,
        action: "Monitoring",
      },
      {
        id: "TRK-FLT-012",
        location: "Collection Vehicle",
        status: openData.today.activeTrucks > 0 ? "In Transit" : "Idle",
        fill: `Capacity: ${Math.min(100, 35 + openData.today.activeTrucks * 10)}%`,
        action:
          openData.today.activeTrucks > 0
            ? "ETA updates active"
            : "Waiting for assignment",
      },
      {
        id: "BIN-MG-088",
        location: "MG Road Metro Station",
        status: "Optimal",
        fill: `${Math.max(20, 46 - critical * 2)}%`,
        action: "Monitoring",
      },
    ];
  }, [openData]);

  return (
    <main className="min-h-screen bg-[#03110d] text-[#ebf8f2]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_28%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(6,95,70,0.28),transparent_34%),linear-gradient(180deg,#041512_0%,#020c0a_52%,#020807_100%)]" />

      <header className="mx-auto flex w-full max-w-[1300px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5 text-white">
          <Image
            src="/logo.svg"
            alt="Swachh City logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <span className="text-[1.75rem] font-semibold tracking-tight">
            Swachh City
          </span>
        </div>

        <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-slate-300 md:flex md:gap-9">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#architecture" className="transition hover:text-white">
            Architecture
          </a>
          <a href="#live-map" className="transition hover:text-white">
            Live Map
          </a>
          <a href="#impact" className="transition hover:text-white">
            Impact
          </a>
        </nav>

        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/dashboard"
            className="text-slate-300 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-[#0f9f74] to-[#18c58e] px-5 py-2.5 font-semibold text-white shadow-[0_10px_26px_rgba(16,185,129,0.35)] transition hover:brightness-110"
          >
            View Demo
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-20 w-full max-w-[1150px] px-6 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          New: Open Data Public View
        </div>

        <h1 className="mx-auto mt-8 max-w-[920px] text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl">
          Reimagining Urban Waste
          <br />
          With a Digital Twin.
        </h1>

        <p className="mx-auto mt-7 max-w-[820px] text-xl leading-relaxed text-slate-400">
          Real-time public intelligence for Bengaluru&apos;s waste network.
          Explore open operational data, monitor bin health, and understand
          dispatch performance without logging in.
        </p>

        <div className="mt-11 flex flex-wrap items-center justify-center gap-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f9f74] to-[#19c892] px-11 py-4 text-lg font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.34)] transition hover:translate-y-[-1px] hover:brightness-110"
          >
            Explore Platform
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#live-map"
            className="text-lg font-semibold text-slate-400 transition hover:text-white"
          >
            Read Documentation
          </a>
        </div>

        <div className="mx-auto mt-16 h-12 w-[520px] max-w-full rounded-full bg-emerald-500/35 blur-3xl" />
      </section>

      <section
        id="impact"
        className="mt-14 border-y border-white/5 bg-[#03130f]/80"
      >
        <div className="mx-auto grid max-w-[1300px] grid-cols-2 divide-x divide-white/5 sm:grid-cols-4">
          <StatCell
            value={`${openData.dashboard.bins.total}+`}
            label="Wards Mapped"
          />
          <StatCell
            value={`${Math.round(openData.collection.totalWaste).toLocaleString()}`}
            label="Waste Collected"
          />
          <StatCell
            value={openData.dashboard.bins.onlinePercentage}
            label="System Uptime"
          />
          <StatCell
            value={`${openData.dashboard.bins.critical}`}
            label="Critical Bins"
          />
        </div>
      </section>

      <section
        id="features"
        className="mx-auto mt-24 grid w-full max-w-[1300px] gap-6 px-6 md:grid-cols-3"
      >
        {[
          {
            icon: Eye,
            title: "Twin Visualization",
            copy: "Interactive map mirroring real-world bin states and truck locations across Bengaluru.",
          },
          {
            icon: Activity,
            title: "Smart Monitoring",
            copy: "Live open-data updates surface fill levels, alerts, and operational status in real time.",
          },
          {
            icon: Cpu,
            title: "AI Optimization",
            copy: "Assignment logic prioritizes urgency, nearest resources, and workload balancing automatically.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-3xl border border-white/8 bg-[#061711]/85 p-10 shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="mb-8 inline-flex rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <Icon className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-4xl font-semibold leading-tight text-white">
                {item.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                {item.copy}
              </p>
            </article>
          );
        })}
      </section>

      <section
        id="live-map"
        className="mx-auto mt-24 w-full max-w-[1300px] px-6"
      >
        <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#051610]/85">
          <div className="grid min-h-[540px] md:grid-cols-[260px_1fr]">
            <aside className="border-r border-white/7 bg-[#04120d]/85 p-8">
              <div className="mb-10 flex items-center gap-2 text-2xl font-semibold text-white">
                <Image
                  src="/logo.svg"
                  alt="Swachh City logo"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                System Control
              </div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Modules
              </p>
              <div className="space-y-2">
                {[
                  { icon: Map, label: "Map View", active: true },
                  { icon: Boxes, label: "Bin Networks", active: false },
                  { icon: Truck, label: "Fleet Tracking", active: false },
                  {
                    icon: Activity,
                    label: "Simulation Engine",
                    active: false,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-lg ${item.active ? "bg-white/[0.06] text-white" : "text-slate-400"}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-24 space-y-4 text-slate-400">
                <div className="flex items-center justify-between text-lg">
                  <span className="inline-flex items-center gap-3">
                    <Bell className="h-5 w-5" /> Alerts
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm">
                    {openData.dashboard.complaints.unresolved}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-lg">
                  <Settings className="h-5 w-5" /> Configuration
                </div>
              </div>
            </aside>

            <div className="p-6 sm:p-8">
              <div className="rounded-2xl border border-white/7 bg-[#07140f]/75">
                <div className="grid gap-4 border-b border-white/7 p-5 md:grid-cols-[1.5fr_1fr] md:items-center">
                  <div className="text-3xl font-semibold text-white">
                    Active Zones (BBMP)
                  </div>
                  <div className="rounded-xl border border-white/7 bg-white/[0.02] px-4 py-2 text-sm text-slate-400">
                    {loading ? "Loading open data..." : "Live open data feed"}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[740px] text-left">
                    <thead>
                      <tr className="text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">
                          Node / Location
                        </th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Fill Level</th>
                        <th className="px-6 py-4 font-medium">
                          Action Required
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const dotColor =
                          row.status === "Critical"
                            ? "bg-rose-400"
                            : row.status === "Warning"
                              ? "bg-amber-400"
                              : row.status === "In Transit"
                                ? "bg-sky-400"
                                : "bg-emerald-400";

                        const badgeClass =
                          row.status === "Critical"
                            ? "border-rose-500/40 text-rose-300"
                            : row.status === "Warning"
                              ? "border-amber-500/40 text-amber-300"
                              : row.status === "In Transit"
                                ? "border-sky-500/40 text-sky-300"
                                : "border-emerald-500/40 text-emerald-300";

                        return (
                          <tr key={row.id} className="border-t border-white/6">
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <span
                                  className={`mt-2 h-2.5 w-2.5 rounded-full ${dotColor}`}
                                />
                                <div>
                                  <p className="text-2xl font-semibold text-white">
                                    {row.id}
                                  </p>
                                  <p className="text-lg text-slate-400">
                                    {row.location}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-lg border px-3 py-1.5 text-sm ${badgeClass}`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-lg text-slate-300">
                              {row.fill}
                            </td>
                            <td className="px-6 py-4 text-lg text-slate-400">
                              {row.action}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="architecture"
        className="mx-auto mt-28 w-full max-w-[1120px] px-6"
      >
        <div className="text-center">
          <h2 className="text-6xl font-semibold tracking-tight text-white">
            Bridging Real & Virtual
          </h2>
          <p className="mt-4 text-3xl text-slate-400">
            How the Swachh City Digital Twin operates.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {[
            [
              "01",
              "Data Aggregation",
              "Ingesting live feeds from BBMP sensors, GPS on trucks, and citizen reports into the core engine.",
            ],
            [
              "02",
              "Twin Synchronization",
              "The virtual model updates instantly, reflecting the exact physical state of the city waste infrastructure.",
            ],
            [
              "03",
              "Simulation & Prediction",
              "Running what-if scenarios. Predicting overflow events before they occur based on historical patterns.",
            ],
            [
              "04",
              "Automated Dispatch",
              "Routing the physical fleet automatically based on the optimal paths calculated within the twin.",
            ],
          ].map(([step, title, copy]) => (
            <article
              key={String(step)}
              className="rounded-[26px] border border-white/8 bg-[#061711]/82 p-8"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-lg font-semibold text-slate-300">
                {String(step)}
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Phase {String(step)}
              </p>
              <h3 className="mt-2 text-4xl font-semibold text-white">
                {String(title)}
              </h3>
              <p className="mt-4 text-xl leading-relaxed text-slate-400">
                {String(copy)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-28 w-full max-w-[1120px] px-6 pb-24 text-center">
        <h2 className="mx-auto max-w-[940px] text-6xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
          Ready to build the future of urban infrastructure?
        </h2>
        <p className="mx-auto mt-7 max-w-[880px] text-2xl text-slate-400">
          Join us in deploying the Swachh City Digital Twin to create cleaner,
          smarter, and more efficient cities.
        </p>

        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f9f74] to-[#19c892] px-11 py-4 text-2xl font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.34)] transition hover:brightness-110"
        >
          Deploy Swachh City
          <Gauge className="h-5 w-5" />
        </Link>

        <div className="mt-16 border-t border-white/6 pt-10 text-slate-500">
          <p className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-300">
            <Image
              src="/logo.svg"
              alt="Swachh City logo"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            Swachh City Team
          </p>
          <p className="mt-3 text-lg">
            Hackathon Prototype • Digital Twin for Urban Waste
          </p>
        </div>
      </section>
    </main>
  );
}
