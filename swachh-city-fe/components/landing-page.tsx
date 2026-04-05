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
import { GenerativeMountainScene } from "@/components/generative-mountain-scene";
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
    <div className="px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-3xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#03110d] text-[#ebf8f2]">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_50%_28%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(6,95,70,0.28),transparent_34%),linear-gradient(180deg,#041512_0%,#020c0a_52%,#020807_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-70 sm:h-[560px]">
        <GenerativeMountainScene />
        <div className="absolute inset-0 bg-linear-to-b from-emerald-300/10 via-transparent to-[#03110d]" />
      </div>

      <header className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 shadow-[0_0_26px_rgba(16,185,129,0.28)]">
            <Image
              src="/logo.svg"
              alt="Swachh City logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
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

        <div className="flex w-full flex-wrap items-center justify-end gap-2 text-sm sm:w-auto sm:gap-3">
          <Link
            href="/dashboard?mode=citizen-login"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
          >
            Citizen Login
          </Link>
          <Link
            href="/dashboard?mode=driver-login"
            className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-5 py-2.5 font-semibold text-emerald-100 shadow-[0_10px_26px_rgba(16,185,129,0.25)] transition hover:brightness-110"
          >
            Driver Login
          </Link>
          <a
            href="https://github.com/sandeep5shetty/swachh-city"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-gradient-to-r from-[#0f9f74] to-[#18c58e] px-5 py-2.5 font-semibold text-white shadow-[0_10px_26px_rgba(16,185,129,0.35)] transition hover:brightness-110"
          >
            View Source Code
          </a>
        </div>
      </header>

      <section className="mx-auto mt-12 w-full max-w-[1150px] px-4 text-center sm:mt-20 sm:px-6">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          New: Open Data Public View
        </div>

        <h1 className="mx-auto mt-8 max-w-[920px] text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Reimagining Urban Waste
          <br />
          With a Digital Twin.
        </h1>

        <p className="mx-auto mt-6 max-w-[820px] text-base leading-relaxed text-slate-400 sm:mt-7 sm:text-xl">
          Real-time public intelligence for Bengaluru&apos;s waste network.
          Explore open operational data, monitor bin health, and understand
          dispatch performance without logging in.
        </p>

        <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard?mode=citizen-login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f9f74] to-[#19c892] px-7 py-3.5 text-base font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.34)] transition hover:translate-y-[-1px] hover:brightness-110 sm:px-11 sm:py-4 sm:text-lg"
          >
            Citizen Login
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard?mode=driver-login"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-6 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white sm:px-8 sm:py-4 sm:text-lg"
          >
            Driver Login
          </Link>
          <Link
            href="/dashboard?mode=admin-login"
            className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3.5 text-base font-semibold text-cyan-100 transition hover:bg-cyan-300/15 hover:text-white sm:px-8 sm:py-4 sm:text-lg"
          >
            Admin Login
          </Link>
          <a
            href="https://github.com/sandeep5shetty/swachh-city"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-6 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white sm:px-8 sm:py-4 sm:text-lg"
          >
            View Source Code
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Choose a role-specific login or open the repository to review the
          project implementation.
        </p>

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
        className="mx-auto mt-16 grid w-full max-w-[1300px] gap-6 px-4 sm:mt-24 sm:px-6 md:grid-cols-3"
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
              className="rounded-3xl border border-white/8 bg-[#061711]/85 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-10"
            >
              <div className="mb-8 inline-flex rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <Icon className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold leading-tight text-white sm:text-4xl">
                {item.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
                {item.copy}
              </p>
            </article>
          );
        })}
      </section>

      <section
        id="live-map"
        className="mx-auto mt-16 w-full max-w-[1300px] px-4 sm:mt-24 sm:px-6"
      >
        <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#051610]/85">
          <div className="grid min-h-[540px] md:grid-cols-[260px_1fr]">
            <aside className="border-b border-white/7 bg-[#04120d]/85 p-5 md:border-b-0 md:border-r md:p-8">
              <div className="mb-8 flex items-center gap-2 text-xl font-semibold text-white md:text-2xl">
                <Image
                  src="/logo.svg"
                  alt="Swachh City logo"
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
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

              <div className="mt-10 space-y-4 text-slate-400 md:mt-24">
                <div className="flex items-center justify-between text-base md:text-lg">
                  <span className="inline-flex items-center gap-3">
                    <Bell className="h-5 w-5" /> Alerts
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-sm">
                    {openData.dashboard.complaints.unresolved}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-base md:text-lg">
                  <Settings className="h-5 w-5" /> Configuration
                </div>
              </div>
            </aside>

            <div className="p-4 sm:p-6 md:p-8">
              <div className="rounded-2xl border border-white/7 bg-[#07140f]/75">
                <div className="grid gap-4 border-b border-white/7 p-5 md:grid-cols-[1.5fr_1fr] md:items-center">
                  <div className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
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
        className="mx-auto mt-16 w-full max-w-[1120px] px-4 sm:mt-28 sm:px-6"
      >
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Bridging Real & Virtual
          </h2>
          <p className="mt-4 text-xl text-slate-400 sm:text-2xl lg:text-3xl">
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
              <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                {String(title)}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
                {String(copy)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-[1120px] px-4 pb-24 text-center sm:mt-28 sm:px-6">
        <h2 className="mx-auto max-w-[940px] text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Ready to build the future of urban infrastructure?
        </h2>
        <p className="mx-auto mt-6 max-w-[880px] text-lg text-slate-400 sm:mt-7 sm:text-2xl">
          Join us in deploying the Swachh City Digital Twin to create cleaner,
          smarter, and more efficient cities.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard?mode=driver-login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0f9f74] to-[#19c892] px-8 py-3.5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.34)] transition hover:brightness-110 sm:px-10 sm:py-4 sm:text-xl"
          >
            Driver Login
            <Gauge className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard?mode=citizen-login"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white sm:px-8 sm:py-4 sm:text-xl"
          >
            Citizen Login
          </Link>
          <a
            href="https://github.com/sandeep5shetty/swachh-city"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/8 hover:text-white sm:px-8 sm:py-4 sm:text-xl"
          >
            View Source Code
          </a>
        </div>

        <div className="mt-16 border-t border-white/6 pt-10 text-slate-500">
          <p className="inline-flex items-center gap-2 text-xl font-semibold text-slate-300 sm:text-2xl">
            <Image
              src="/logo.svg"
              alt="Swachh City logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            Swachh City Team
          </p>
          <p className="mt-3 text-base sm:text-lg">
            Hackathon Prototype • Digital Twin for Urban Waste
          </p>
        </div>
      </section>
    </main>
  );
}
