"use client";

import {
  Bell,
  ChartNoAxesCombined,
  CircleAlert,
  Hand,
  LayoutDashboard,
  Leaf,
  Map as MapIcon,
  MapPin,
  ShieldAlert,
  Truck,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Map as UiMap,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerPopup,
  type MapViewport,
} from "@/components/ui/map";

type NavKey = "dashboard" | "live-map" | "fleet" | "reports" | "analytics";
type MapMode = "live" | "heatmap";
type BinState = "green" | "yellow" | "red";
type Severity = "low" | "medium" | "high";
type ReportStatus = "pending" | "in-progress" | "resolved";

type TwinBin = {
  id: string;
  label: string;
  offsetLng: number;
  offsetLat: number;
  fill: number;
};

type FleetTruck = {
  id: string;
  name: string;
  status: "idle" | "en-route" | "collecting";
  capacity: number;
  route: string[];
  routeIndex: number;
};

type CitizenReport = {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: Severity;
  status: ReportStatus;
  timestamp: string;
};

type GeoPoint = {
  longitude: number;
  latitude: number;
};

const DEFAULT_CITY_CENTER: [number, number] = [77.5946, 12.9716];

const initialBins: TwinBin[] = [
  { id: "B01", label: "MG Road", offsetLng: 0.011, offsetLat: 0.008, fill: 34 },
  { id: "B02", label: "Ulsoor", offsetLng: 0.021, offsetLat: 0.004, fill: 22 },
  {
    id: "B03",
    label: "Indiranagar",
    offsetLng: 0.028,
    offsetLat: -0.005,
    fill: 52,
  },
  {
    id: "B04",
    label: "Shivajinagar",
    offsetLng: 0.006,
    offsetLat: 0.017,
    fill: 68,
  },
  {
    id: "B05",
    label: "Church Street",
    offsetLng: -0.003,
    offsetLat: 0.013,
    fill: 82,
  },
  {
    id: "B06",
    label: "JP Nagar",
    offsetLng: -0.02,
    offsetLat: -0.018,
    fill: 46,
  },
  { id: "B07", label: "Domlur", offsetLng: 0.038, offsetLat: -0.012, fill: 39 },
  {
    id: "B08",
    label: "Koramangala",
    offsetLng: 0.015,
    offsetLat: -0.029,
    fill: 63,
  },
  {
    id: "B09",
    label: "Richmond",
    offsetLng: -0.012,
    offsetLat: -0.006,
    fill: 29,
  },
  { id: "B10", label: "Hebbal", offsetLng: 0.003, offsetLat: 0.041, fill: 74 },
  {
    id: "B11",
    label: "KR Puram",
    offsetLng: 0.052,
    offsetLat: 0.012,
    fill: 41,
  },
  {
    id: "B12",
    label: "Majestic",
    offsetLng: -0.015,
    offsetLat: 0.007,
    fill: 55,
  },
];

const initialTrucks: FleetTruck[] = [
  {
    id: "TR-01",
    name: "Truck Alpha",
    status: "en-route",
    capacity: 58,
    route: ["B01", "B03", "B05", "B08"],
    routeIndex: 0,
  },
  {
    id: "TR-02",
    name: "Truck Bravo",
    status: "collecting",
    capacity: 71,
    route: ["B06", "B10", "B11", "B04"],
    routeIndex: 0,
  },
  {
    id: "TR-03",
    name: "Truck Charlie",
    status: "idle",
    capacity: 33,
    route: ["B02", "B12", "B07"],
    routeIndex: 0,
  },
  {
    id: "TR-04",
    name: "Truck Delta",
    status: "en-route",
    capacity: 61,
    route: ["B04", "B09", "B10", "B05"],
    routeIndex: 0,
  },
  {
    id: "TR-05",
    name: "Truck Echo",
    status: "idle",
    capacity: 27,
    route: ["B09", "B06", "B01"],
    routeIndex: 0,
  },
];

const initialReports: CitizenReport[] = [
  {
    id: "R-201",
    title: "Overflowing Bin on MG Road",
    description:
      "Garbage scattered around bin area, smells very bad and attracts dogs.",
    location: "MG Road, Ward 42",
    severity: "high",
    status: "pending",
    timestamp: "2 hours ago",
  },
  {
    id: "R-202",
    title: "Damaged Container",
    description: "The lid is broken and dogs are getting in.",
    location: "JP Nagar 1st Phase",
    severity: "medium",
    status: "resolved",
    timestamp: "Yesterday",
  },
  {
    id: "R-203",
    title: "Missed Pickup Near Bus Stop",
    description: "No pickup in the last two days in this stretch.",
    location: "Indiranagar 100ft Rd",
    severity: "medium",
    status: "in-progress",
    timestamp: "35 mins ago",
  },
];

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "live-map", label: "Live Map", icon: MapIcon },
  { key: "fleet", label: "Fleet Management", icon: Truck },
  { key: "reports", label: "Citizen Reports", icon: ShieldAlert },
  { key: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
];

function getBinState(fill: number): BinState {
  if (fill < 40) {
    return "green";
  }
  if (fill < 80) {
    return "yellow";
  }
  return "red";
}

function pinColor(state: BinState) {
  if (state === "green") {
    return "border-emerald-500/60 text-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.36)]";
  }
  if (state === "yellow") {
    return "border-amber-500/60 text-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.35)]";
  }
  return "border-rose-500/60 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
}

function markerScale(fill: number) {
  if (fill < 40) return 1;
  if (fill < 80) return 1.1;
  return 1.2;
}

function toGeoPoint(
  anchor: [number, number],
  lngOffset: number,
  latOffset: number,
): GeoPoint {
  return {
    longitude: anchor[0] + lngOffset,
    latitude: anchor[1] + latOffset,
  };
}

export function WasteDashboard() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [mapMode, setMapMode] = useState<MapMode>("live");
  const [simulationActive, setSimulationActive] = useState(true);

  const [bins, setBins] = useState(initialBins);
  const [trucks, setTrucks] = useState(initialTrucks);
  const [reports, setReports] = useState(initialReports);

  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | ReportStatus>("all");

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [mapViewport, setMapViewport] = useState<Partial<MapViewport>>({
    center: DEFAULT_CITY_CENTER,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const [locationInput, setLocationInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [severityInput, setSeverityInput] = useState<Severity>("low");
  const [imageName, setImageName] = useState("No image selected");

  const anchorCenter = userLocation ?? DEFAULT_CITY_CENTER;

  const geoBins = useMemo(() => {
    return bins.map((bin) => ({
      ...bin,
      ...toGeoPoint(anchorCenter, bin.offsetLng, bin.offsetLat),
    }));
  }, [bins, anchorCenter]);

  const binLookup = useMemo(() => {
    const map = new globalThis.Map<string, (typeof geoBins)[number]>();
    geoBins.forEach((bin) => map.set(bin.id, bin));
    return map;
  }, [geoBins]);

  const geoTrucks = useMemo(() => {
    return trucks.map((truck) => {
      const anchorBin =
        binLookup.get(truck.route[truck.routeIndex]) ?? geoBins[0];
      return {
        ...truck,
        longitude: anchorBin.longitude,
        latitude: anchorBin.latitude,
      };
    });
  }, [trucks, binLookup, geoBins]);

  const routeCoordinates = useMemo(() => {
    return geoTrucks.map((truck) => {
      const coordinates = truck.route
        .map((binId) => {
          const bin = binLookup.get(binId);
          if (!bin) return null;
          return [bin.longitude, bin.latitude] as [number, number];
        })
        .filter((point): point is [number, number] => point !== null);
      return {
        id: truck.id,
        coordinates,
      };
    });
  }, [geoTrucks, binLookup]);

  useEffect(() => {
    if (!simulationActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setBins((previousBins) => {
        const nextBins = previousBins.map((bin) => {
          const fillDelta = bin.fill < 55 ? 3 : 2;
          let fill = Math.min(98, bin.fill + fillDelta);

          if (fill >= 84 && Math.random() > 0.45) {
            fill = Math.max(18, fill - 44);
          }

          return { ...bin, fill };
        });

        setTrucks((previousTrucks) =>
          previousTrucks.map((truck) => {
            const nextRouteIndex = (truck.routeIndex + 1) % truck.route.length;
            const nextBin =
              nextBins.find((bin) => bin.id === truck.route[nextRouteIndex]) ??
              nextBins[0];
            const nextStatus =
              nextBin.fill > 78
                ? "collecting"
                : nextRouteIndex % 2 === 0
                  ? "en-route"
                  : "idle";
            const nextCapacity = Math.min(
              94,
              Math.max(
                16,
                truck.capacity + (nextStatus === "collecting" ? 6 : -2),
              ),
            );
            return {
              ...truck,
              routeIndex: nextRouteIndex,
              status: nextStatus,
              capacity: nextCapacity,
            };
          }),
        );

        return nextBins;
      });
    }, 2800);

    return () => window.clearInterval(timer);
  }, [simulationActive]);

  const binCounts = useMemo(() => {
    return bins.reduce(
      (acc, bin) => {
        const state = getBinState(bin.fill);
        acc[state] += 1;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 },
    );
  }, [bins]);

  const unresolvedReports = reports.filter(
    (report) => report.status !== "resolved",
  ).length;
  const activeFleet = trucks.filter((truck) => truck.status !== "idle").length;

  const selectedBin = selectedBinId
    ? (geoBins.find((bin) => bin.id === selectedBinId) ?? null)
    : null;
  const selectedTruck = selectedTruckId
    ? (geoTrucks.find((truck) => truck.id === selectedTruckId) ?? null)
    : null;

  const filteredReports = useMemo(() => {
    if (reportFilter === "all") {
      return reports;
    }
    return reports.filter((report) => report.status === reportFilter);
  }, [reportFilter, reports]);

  function resetSelection() {
    setSelectedBinId(null);
    setSelectedTruckId(null);
  }

  function submitReport() {
    if (!locationInput.trim() || !descriptionInput.trim()) {
      return;
    }

    const report: CitizenReport = {
      id: `R-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Manual report at ${locationInput.trim()}`,
      description: descriptionInput.trim(),
      location: locationInput.trim(),
      severity: severityInput,
      status: "pending",
      timestamp: "Just now",
    };

    setReports((prev) => [report, ...prev]);
    setLocationInput("");
    setDescriptionInput("");
    setSeverityInput("low");
    setImageName("No image selected");
    setActiveNav("reports");
  }

  function cycleTruckStatus(truckId: string) {
    setTrucks((prev) =>
      prev.map((truck) => {
        if (truck.id !== truckId) {
          return truck;
        }

        const nextStatus =
          truck.status === "idle"
            ? "en-route"
            : truck.status === "en-route"
              ? "collecting"
              : "idle";
        return { ...truck, status: nextStatus };
      }),
    );
  }

  return (
    <main className="min-h-screen bg-[#05070f] text-[#f5f7ff]">
      <div className="mx-auto flex w-full max-w-[1440px] gap-0 px-2 py-2 lg:px-4">
        <aside className="hidden w-[290px] shrink-0 border border-white/10 bg-[#070a13] lg:block">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none tracking-tight text-white">
                  Swachh City
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Digital Twin
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 px-3 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              const badge =
                item.key === "reports" ? `${unresolvedReports}` : "";

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.key);
                    if (item.key !== "live-map") {
                      resetSelection();
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${isActive ? "bg-white/12 text-white" : "text-slate-400 hover:bg-white/6 hover:text-slate-100"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium leading-none">{item.label}</span>
                  {badge && Number(badge) > 0 ? (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-24 border-t border-white/10 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold leading-none text-white">
                  Admin User
                </p>
                <p className="mt-1 text-sm leading-none text-slate-500">
                  Control Center
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 border border-white/10 bg-[#060913]">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {activeNav === "dashboard" && "System Overview"}
              {activeNav === "live-map" && "Digital Twin Live Map"}
              {activeNav === "fleet" && "Fleet Operations"}
              {activeNav === "reports" && "Citizen Reports Center"}
              {activeNav === "analytics" && "Analytics Dashboard"}
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSimulationActive((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300"
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${simulationActive ? "bg-emerald-400" : "bg-slate-500"}`}
                />
                <span>
                  {simulationActive ? "Simulation Active" : "Simulation Paused"}
                </span>
              </button>
              <button
                type="button"
                className="relative text-slate-300 transition hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              </button>
            </div>
          </header>

          <div className="space-y-4 p-4 sm:p-5 lg:p-6">
            {activeNav === "dashboard" ? (
              <>
                <section className="grid gap-4 lg:grid-cols-4">
                  <MetricCard
                    title="Total Active Bins"
                    value={`${bins.length}`}
                    accent="green"
                    subline="100% Online"
                    icon={<Leaf className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Critical Status (>80%)"
                    value={`${binCounts.red}`}
                    accent="red"
                    subline="Require pickup"
                    icon={<CircleAlert className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Active Fleet"
                    value={`${activeFleet}`}
                    accent="blue"
                    subline={`/ ${trucks.length} Total Trucks`}
                    icon={<Truck className="h-4 w-4" />}
                  />
                  <MetricCard
                    title="Unresolved Reports"
                    value={`${unresolvedReports}`}
                    accent="amber"
                    subline="Needs action"
                    icon={<ShieldAlert className="h-4 w-4" />}
                  />
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.85fr)_320px]">
                  <TwinMapPanel
                    bins={geoBins}
                    trucks={geoTrucks}
                    mapMode={mapMode}
                    routeCoordinates={routeCoordinates}
                    selectedBinId={selectedBinId}
                    selectedTruckId={selectedTruckId}
                    viewport={mapViewport}
                    onViewportChange={setMapViewport}
                    onLocate={(coords) => {
                      const nextCenter: [number, number] = [
                        coords.longitude,
                        coords.latitude,
                      ];
                      setUserLocation(nextCenter);
                      setMapViewport((prev) => ({
                        ...prev,
                        center: nextCenter,
                        zoom: 13,
                      }));
                    }}
                    onSelectBin={(binId) => {
                      setSelectedTruckId(null);
                      setSelectedBinId(binId);
                    }}
                    onSelectTruck={(truckId) => {
                      setSelectedBinId(null);
                      setSelectedTruckId(truckId);
                    }}
                    onMapModeChange={setMapMode}
                  />

                  <NodeInspector
                    selectedBin={selectedBin}
                    selectedTruck={selectedTruck}
                  />
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <ReportsPanel
                    reports={reports}
                    onOpenReports={() => setActiveNav("reports")}
                    compact
                  />
                  <ManualReportPanel
                    locationInput={locationInput}
                    descriptionInput={descriptionInput}
                    severityInput={severityInput}
                    imageName={imageName}
                    setLocationInput={setLocationInput}
                    setDescriptionInput={setDescriptionInput}
                    setSeverityInput={setSeverityInput}
                    setImageName={setImageName}
                    onSubmit={submitReport}
                  />
                </section>
              </>
            ) : null}

            {activeNav === "live-map" ? (
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.95fr)_350px]">
                <TwinMapPanel
                  bins={geoBins}
                  trucks={geoTrucks}
                  mapMode={mapMode}
                  routeCoordinates={routeCoordinates}
                  selectedBinId={selectedBinId}
                  selectedTruckId={selectedTruckId}
                  viewport={mapViewport}
                  onViewportChange={setMapViewport}
                  onLocate={(coords) => {
                    const nextCenter: [number, number] = [
                      coords.longitude,
                      coords.latitude,
                    ];
                    setUserLocation(nextCenter);
                    setMapViewport((prev) => ({
                      ...prev,
                      center: nextCenter,
                      zoom: 13,
                    }));
                  }}
                  onSelectBin={(binId) => {
                    setSelectedTruckId(null);
                    setSelectedBinId(binId);
                  }}
                  onSelectTruck={(truckId) => {
                    setSelectedBinId(null);
                    setSelectedTruckId(truckId);
                  }}
                  onMapModeChange={setMapMode}
                />
                <div className="space-y-4">
                  <NodeInspector
                    selectedBin={selectedBin}
                    selectedTruck={selectedTruck}
                  />
                  <div className="rounded-xl border border-white/10 bg-[#111520] p-4">
                    <h3 className="text-lg font-semibold text-white">
                      Live Controls
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Use locate button to center map around your current
                      position.
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>Total bins tracked: {bins.length}</p>
                      <p>Fleet currently active: {activeFleet}</p>
                      <p>Critical nodes: {binCounts.red}</p>
                      <p>
                        Current map center:{" "}
                        {mapViewport.center
                          ? `${mapViewport.center[1].toFixed(4)}, ${mapViewport.center[0].toFixed(4)}`
                          : "not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeNav === "fleet" ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {geoTrucks.map((truck) => (
                  <article
                    key={truck.id}
                    className="rounded-xl border border-white/10 bg-[#111520] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">{truck.id}</p>
                        <h3 className="text-lg font-semibold text-white">
                          {truck.name}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${truck.status === "collecting" ? "bg-amber-500/16 text-amber-300" : truck.status === "en-route" ? "bg-cyan-500/18 text-cyan-300" : "bg-slate-500/20 text-slate-300"}`}
                      >
                        {truck.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Capacity used: {truck.capacity}%
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-300"
                        style={{ width: `${truck.capacity}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Assigned route: {truck.route.join(" -> ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Current point: {truck.latitude.toFixed(4)},{" "}
                      {truck.longitude.toFixed(4)}
                    </p>
                    <button
                      type="button"
                      onClick={() => cycleTruckStatus(truck.id)}
                      className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      Change Status
                    </button>
                  </article>
                ))}
              </section>
            ) : null}

            {activeNav === "reports" ? (
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <ReportsPanel
                  reports={filteredReports}
                  compact={false}
                  filter={reportFilter}
                  onFilterChange={setReportFilter}
                />
                <ManualReportPanel
                  locationInput={locationInput}
                  descriptionInput={descriptionInput}
                  severityInput={severityInput}
                  imageName={imageName}
                  setLocationInput={setLocationInput}
                  setDescriptionInput={setDescriptionInput}
                  setSeverityInput={setSeverityInput}
                  setImageName={setImageName}
                  onSubmit={submitReport}
                />
              </section>
            ) : null}

            {activeNav === "analytics" ? (
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-white/10 bg-[#111520] p-4">
                  <h3 className="text-xl font-semibold text-white">
                    Bin Fill Distribution
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Live values from hardcoded simulation state.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {bins.map((bar) => (
                      <div
                        key={bar.id}
                        className="rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                        <p className="text-xs text-slate-500">{bar.id}</p>
                        <div className="mt-2 h-20 w-full rounded bg-slate-900 p-1">
                          <div className="h-full w-full rounded bg-slate-950">
                            <div
                              className="mx-auto h-full w-3 rounded bg-linear-to-t from-cyan-400 via-amber-400 to-rose-400"
                              style={{ height: `${bar.fill}%` }}
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-sm font-medium text-white">
                          {bar.fill}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#111520] p-4">
                  <h3 className="text-xl font-semibold text-white">
                    Operational Summary
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-300">
                    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
                      Green bins: {binCounts.green}
                    </li>
                    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
                      Yellow bins: {binCounts.yellow}
                    </li>
                    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
                      Red bins: {binCounts.red}
                    </li>
                    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
                      Fleet active: {activeFleet} / {trucks.length}
                    </li>
                    <li className="rounded-lg border border-white/10 bg-black/20 p-3">
                      Unresolved complaints: {unresolvedReports}
                    </li>
                  </ul>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function TwinMapPanel({
  bins,
  trucks,
  mapMode,
  routeCoordinates,
  selectedBinId,
  selectedTruckId,
  viewport,
  onViewportChange,
  onLocate,
  onSelectBin,
  onSelectTruck,
  onMapModeChange,
}: {
  bins: Array<TwinBin & GeoPoint>;
  trucks: Array<FleetTruck & GeoPoint>;
  mapMode: MapMode;
  routeCoordinates: Array<{ id: string; coordinates: [number, number][] }>;
  selectedBinId: string | null;
  selectedTruckId: string | null;
  viewport: Partial<MapViewport>;
  onViewportChange: (viewport: MapViewport) => void;
  onLocate: (coords: { longitude: number; latitude: number }) => void;
  onSelectBin: (binId: string) => void;
  onSelectTruck: (truckId: string) => void;
  onMapModeChange: (mode: MapMode) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f1c] p-3 sm:p-4">
      <div className="relative h-[500px] overflow-hidden rounded-xl border border-white/10 bg-[#050913]">
        <div className="absolute left-4 top-4 z-20 inline-flex rounded-lg border border-white/10 bg-black/45 p-1">
          <button
            type="button"
            onClick={() => onMapModeChange("live")}
            className={`rounded-md px-3 py-1.5 text-sm ${mapMode === "live" ? "bg-white/10 text-white" : "text-slate-400"}`}
          >
            Live View
          </button>
          <button
            type="button"
            onClick={() => onMapModeChange("heatmap")}
            className={`rounded-md px-3 py-1.5 text-sm ${mapMode === "heatmap" ? "bg-white/10 text-white" : "text-slate-400"}`}
          >
            Heatmap
          </button>
        </div>

        <UiMap
          className="h-full w-full"
          viewport={viewport}
          onViewportChange={onViewportChange}
          projection={{ type: "mercator" }}
          maxZoom={16}
          minZoom={10}
          theme="dark"
        >
          <MapControls
            showZoom
            showLocate
            showFullscreen
            showCompass
            position="bottom-right"
            onLocate={onLocate}
          />

          {routeCoordinates.map((route) => (
            <MapRoute
              key={route.id}
              id={route.id}
              coordinates={route.coordinates}
              color="#22d3ee"
              width={2.5}
              opacity={0.5}
              dashArray={[2, 2]}
            />
          ))}

          {mapMode === "heatmap"
            ? bins.map((bin) => (
                <MapMarker
                  key={`heat-${bin.id}`}
                  longitude={bin.longitude}
                  latitude={bin.latitude}
                >
                  <MarkerContent>
                    <div
                      className={`rounded-full ${getBinState(bin.fill) === "green" ? "bg-emerald-500/35" : getBinState(bin.fill) === "yellow" ? "bg-amber-500/35" : "bg-rose-500/35"}`}
                      style={{
                        width: 30 + bin.fill * 0.65,
                        height: 30 + bin.fill * 0.65,
                      }}
                    />
                  </MarkerContent>
                </MapMarker>
              ))
            : null}

          {bins.map((bin) => {
            const state = getBinState(bin.fill);
            return (
              <MapMarker
                key={bin.id}
                longitude={bin.longitude}
                latitude={bin.latitude}
              >
                <MarkerContent>
                  <button
                    type="button"
                    onClick={() => onSelectBin(bin.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border bg-[#071121] transition hover:scale-110 ${pinColor(state)} ${selectedBinId === bin.id ? "ring-2 ring-white/70" : ""}`}
                    style={{ transform: `scale(${markerScale(bin.fill)})` }}
                    title={`${bin.label} (${bin.fill}%)`}
                  >
                    <Leaf className="h-3.5 w-3.5" />
                  </button>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-white">{bin.label}</p>
                    <p className="text-slate-300">Bin {bin.id}</p>
                    <p className="text-slate-300">Fill: {bin.fill}%</p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}

          {trucks.map((truck) => (
            <MapMarker
              key={truck.id}
              longitude={truck.longitude}
              latitude={truck.latitude}
            >
              <MarkerContent>
                <button
                  type="button"
                  onClick={() => onSelectTruck(truck.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white text-black shadow transition hover:scale-105 ${selectedTruckId === truck.id ? "ring-2 ring-cyan-300" : ""}`}
                  title={`${truck.name} (${truck.status})`}
                >
                  <Truck className="h-4 w-4" />
                </button>
              </MarkerContent>
              <MarkerPopup>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-white">{truck.name}</p>
                  <p className="text-slate-300">Status: {truck.status}</p>
                  <p className="text-slate-300">Capacity: {truck.capacity}%</p>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </UiMap>

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-sm text-slate-300">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.17em] text-slate-400">
            Fill level legend
          </p>
          <div className="flex items-center gap-4">
            <LegendDot color="bg-emerald-400" label="0-40%" />
            <LegendDot color="bg-amber-400" label="40-80%" />
            <LegendDot color="bg-rose-400" label="80%+" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeInspector({
  selectedBin,
  selectedTruck,
}: {
  selectedBin: (TwinBin & GeoPoint) | null;
  selectedTruck: (FleetTruck & GeoPoint) | null;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111520]">
      <div className="border-b border-white/10 px-4 py-4">
        <h3 className="text-2xl font-semibold text-white">Node Inspector</h3>
        <p className="mt-1 text-sm text-slate-400">
          Select a bin or fleet vehicle on map for details
        </p>
      </div>
      <div className="flex min-h-[470px] items-center justify-center px-6 py-8 text-center">
        {selectedBin ? (
          <div className="w-full rounded-xl border border-white/10 bg-[#0d1220] p-4 text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Bin {selectedBin.id}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {selectedBin.label}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Fill Level: {selectedBin.fill}%
            </p>
            <p className="mt-1 text-sm text-slate-400">
              State: {getBinState(selectedBin.fill).toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coords: {selectedBin.latitude.toFixed(5)},{" "}
              {selectedBin.longitude.toFixed(5)}
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-400"
                style={{ width: `${selectedBin.fill}%` }}
              />
            </div>
          </div>
        ) : selectedTruck ? (
          <div className="w-full rounded-xl border border-white/10 bg-[#0d1220] p-4 text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Truck {selectedTruck.id}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {selectedTruck.name}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Status: {selectedTruck.status}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Capacity: {selectedTruck.capacity}%
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Route: {selectedTruck.route.join(" -> ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coords: {selectedTruck.latitude.toFixed(5)},{" "}
              {selectedTruck.longitude.toFixed(5)}
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-slate-300">
              <Hand className="h-8 w-8" />
            </div>
            <p className="text-2xl font-semibold text-white">No selection</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Click on any bin or fleet vehicle on the twin map to view
              real-time telemetry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsPanel({
  reports,
  compact,
  onOpenReports,
  filter,
  onFilterChange,
}: {
  reports: CitizenReport[];
  compact: boolean;
  onOpenReports?: () => void;
  filter?: "all" | ReportStatus;
  onFilterChange?: (value: "all" | ReportStatus) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111520]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Users className="h-4 w-4" />
          <h3 className="text-2xl font-semibold">Recent Citizen Reports</h3>
        </div>
        {compact ? (
          <button
            type="button"
            onClick={onOpenReports}
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            View All
          </button>
        ) : (
          <div className="inline-flex rounded-lg border border-white/10 bg-black/25 p-1">
            {(["all", "pending", "in-progress", "resolved"] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onFilterChange?.(value)}
                  className={`rounded-md px-2.5 py-1 text-xs capitalize ${filter === value ? "bg-white/10 text-white" : "text-slate-400"}`}
                >
                  {value}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div
        className={`space-y-3 p-4 ${compact ? "max-h-[420px]" : "max-h-[600px] overflow-y-auto"}`}
      >
        {reports.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
        {!reports.length ? (
          <p className="text-sm text-slate-500">
            No reports for the selected filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ManualReportPanel({
  locationInput,
  descriptionInput,
  severityInput,
  imageName,
  setLocationInput,
  setDescriptionInput,
  setSeverityInput,
  setImageName,
  onSubmit,
}: {
  locationInput: string;
  descriptionInput: string;
  severityInput: Severity;
  imageName: string;
  setLocationInput: (v: string) => void;
  setDescriptionInput: (v: string) => void;
  setSeverityInput: (v: Severity) => void;
  setImageName: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-linear-to-br from-[#111520] to-[#0b1327]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-white">
        <CircleAlert className="h-4 w-4 text-blue-400" />
        <h3 className="text-2xl font-semibold">Log Manual Report</h3>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-400">
          Submit visual evidence of waste anomalies
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">
              Location coordinates / Address
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="e.g. 12.9716° N, Ward 42"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">
              Severity Level
            </label>
            <select
              value={severityInput}
              onChange={(event) =>
                setSeverityInput(event.target.value as Severity)
              }
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none focus:border-blue-400/60"
            >
              <option value="low">Low (Litter)</option>
              <option value="medium">Medium (Overflow)</option>
              <option value="high">High (Hazard)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-400">
            Description
          </label>
          <textarea
            value={descriptionInput}
            onChange={(event) => setDescriptionInput(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
            placeholder="Briefly describe the issue..."
          />
        </div>

        <label className="block cursor-pointer rounded-lg border border-dashed border-white/10 bg-black/25 px-3 py-5 text-center text-sm text-slate-300 hover:bg-black/35">
          <Upload className="mx-auto mb-2 h-5 w-5" />
          <p className="font-medium">Click to upload image</p>
          <p className="mt-1 text-xs text-slate-500">{imageName}</p>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setImageName(file ? file.name : "No image selected");
            }}
          />
        </label>

        <button
          type="button"
          onClick={onSubmit}
          className="h-10 w-full rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          Submit Report
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subline,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subline: string;
  icon: React.ReactNode;
  accent: "green" | "red" | "blue" | "amber";
}) {
  const accentBadge =
    accent === "green"
      ? "bg-emerald-500/16 text-emerald-400"
      : accent === "red"
        ? "bg-rose-500/16 text-rose-400"
        : accent === "blue"
          ? "bg-blue-500/18 text-blue-400"
          : "bg-amber-500/16 text-amber-300";

  const accentValue = accent === "red" ? "text-rose-400" : "text-white";

  return (
    <article className="rounded-xl border border-white/10 bg-[#111520] px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <p className="max-w-[160px] text-sm leading-5 text-slate-400">
          {title}
        </p>
        <div className={`rounded-lg p-2 ${accentBadge}`}>{icon}</div>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <p className={`text-4xl font-semibold leading-none ${accentValue}`}>
          {value}
        </p>
        <p className={`mb-1 rounded px-1.5 py-0.5 text-[11px] ${accentBadge}`}>
          {subline}
        </p>
      </div>
    </article>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function ReportRow({ report }: { report: CitizenReport }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {report.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {report.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>{report.location}</span>
          <span>{report.timestamp}</span>
        </div>
      </div>
      <span
        className={`ml-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${report.status === "pending" ? "bg-rose-500/18 text-rose-300" : report.status === "in-progress" ? "bg-amber-500/16 text-amber-300" : "bg-emerald-500/16 text-emerald-300"}`}
      >
        {report.status}
      </span>
    </div>
  );
}
