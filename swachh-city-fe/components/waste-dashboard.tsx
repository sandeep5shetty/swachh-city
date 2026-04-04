"use client";

import {
  Bell,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  ExternalLink,
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
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Map as UiMap,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerPopup,
  type MapViewport,
} from "@/components/ui/map";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavKey =
  | "dashboard"
  | "live-map"
  | "fleet"
  | "reports"
  | "analytics"
  | "driver";
type MapMode = "live" | "heatmap";
type BinState = "green" | "yellow" | "red";
type Severity = "low" | "medium" | "high";
type ReportStatus = "pending" | "in-progress" | "resolved";
type AuthRole = "citizen" | "admin";
type AuthMode = "citizen-login" | "citizen-register" | "admin-login";
type TaskStatus = "pending" | "in-progress" | "completed";
type TaskPriority = "high" | "medium";

type DriverNotification = {
  id: string;
  message: string;
  timestamp: string;
  priority: TaskPriority;
  read: boolean;
};

type DriverTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  source: "bin" | "complaint";
  locationLabel: string;
  location: GeoPoint;
  assignedTruckId: string | null;
  distanceKm: number | null;
  createdAt: number;
};

type TwinBin = {
  id: string;
  label: string;
  longitude: number;
  latitude: number;
  fill: number;
};

type FleetTruck = {
  id: string;
  name: string;
  status: "idle" | "en-route" | "collecting" | "busy";
  capacity: number;
  route: string[];
  routeIndex: number;
  longitude: number;
  latitude: number;
};

type CitizenReport = {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: Severity;
  status: ReportStatus;
  timestamp: string;
  imageUrl?: string;
  imagePublicId?: string;
};

type GeoPoint = {
  longitude: number;
  latitude: number;
};

const DEFAULT_CITY_CENTER: [number, number] = [77.5946, 12.9716];
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

type BackendBin = {
  _id: string;
  binId?: string;
  area?: string;
  landmark?: string;
  address?: string;
  fillLevel?: number;
  currentLoad?: number;
  capacity?: number;
  location?: { lat?: number; lng?: number };
};

type BackendTruck = {
  _id: string;
  regNo?: string;
  driverName?: string;
  usedCapacity?: number;
  totalCapacity?: number;
  status?: "IDLE" | "BUSY";
  currentLocation?: { lat?: number; lng?: number };
};

type BackendComplaint = {
  _id: string;
  issueType?: string;
  image?: string;
  location?: { lat?: number; lng?: number };
  createdAt?: string;
};

type BackendAuthResponse = {
  id?: string;
  role?: AuthRole;
  token: string;
};

function formatRelativeTime(input?: string) {
  if (!input) {
    return "Just now";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

function inferSeverity(issueType?: string): Severity {
  const normalized = (issueType ?? "").toLowerCase();
  if (normalized.includes("hazard") || normalized.includes("critical")) {
    return "high";
  }
  if (normalized.includes("overflow") || normalized.includes("medium")) {
    return "medium";
  }
  return "low";
}

function parseLatLng(input: string): { lat: number; lng: number } | null {
  const matches = input.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 2) {
    return null;
  }

  const lat = Number(matches[0]);
  const lng = Number(matches[1]);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return { lat, lng };
}

async function fetchJson<T>(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `Cannot connect to backend at ${BACKEND_BASE_URL}. Make sure backend server is running and NEXT_PUBLIC_BACKEND_URL is correct.`,
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "live-map", label: "Live Map", icon: MapIcon },
  { key: "driver", label: "Driver Ops", icon: Zap },
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

function toCloudinaryPreview(url: string, width = 320, height = 200) {
  if (!url.includes("/upload/")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,c_fill,w_${width},h_${height}/`,
  );
}

function toDistanceKm(a: GeoPoint, b: GeoPoint) {
  const latKm = (a.latitude - b.latitude) * 111;
  const lngKm = (a.longitude - b.longitude) * 111;
  return Math.sqrt(latKm * latKm + lngKm * lngKm);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.floor(Date.now() + Math.random() * 10000)}`;
}

export function WasteDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("citizen-login");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [mapMode, setMapMode] = useState<MapMode>("live");
  const [simulationActive, setSimulationActive] = useState(true);

  const [bins, setBins] = useState<TwinBin[]>([]);
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<"all" | ReportStatus>("all");

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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [toastQueue, setToastQueue] = useState<DriverNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [driverTasks, setDriverTasks] = useState<DriverTask[]>([]);

  const alertedBinsRef = useRef<Set<string>>(new Set());
  const notifiedComplaintsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = window.localStorage.getItem("swachh_auth_token");
    const role = window.localStorage.getItem(
      "swachh_auth_role",
    ) as AuthRole | null;
    const userId = window.localStorage.getItem("swachh_auth_user_id");

    if (token && (role === "admin" || role === "citizen")) {
      setAuthToken(token);
      setAuthRole(role);
      setAuthUserId(userId);
    }

    setAuthReady(true);
  }, []);

  function persistSession(
    payload: BackendAuthResponse,
    fallbackRole: AuthRole,
  ) {
    const resolvedRole = payload.role ?? fallbackRole;

    setAuthToken(payload.token);
    setAuthRole(resolvedRole);
    setAuthUserId(payload.id ?? null);
    setAuthError(null);

    window.localStorage.setItem("swachh_auth_token", payload.token);
    window.localStorage.setItem("swachh_auth_role", resolvedRole);
    if (payload.id) {
      window.localStorage.setItem("swachh_auth_user_id", payload.id);
    } else {
      window.localStorage.removeItem("swachh_auth_user_id");
    }
  }

  function logout() {
    setAuthToken(null);
    setAuthRole(null);
    setAuthUserId(null);
    setAuthError(null);
    setDataError(null);
    setReports([]);
    setBins([]);
    setTrucks([]);

    window.localStorage.removeItem("swachh_auth_token");
    window.localStorage.removeItem("swachh_auth_role");
    window.localStorage.removeItem("swachh_auth_user_id");
  }

  async function loginCitizen(email: string, password: string) {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const payload = await fetchJson<BackendAuthResponse>("/api/user/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persistSession(payload, "citizen");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Citizen login failed",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function loginAdmin(email: string, password: string) {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const payload = await fetchJson<BackendAuthResponse>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persistSession(payload, "admin");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Admin login failed",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function registerCitizen(form: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
  }) {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const payload = await fetchJson<BackendAuthResponse>(
        "/api/user/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone ? Number(form.phone) : undefined,
            address: form.address,
            gender: form.gender,
          }),
        },
      );
      persistSession(payload, "citizen");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Citizen registration failed",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  const loadOperationalData = useCallback(async () => {
    if (!authToken || !authRole) {
      return;
    }

    const authHeader = { Authorization: `Bearer ${authToken}` };

    const [rawBins, rawTrucks, rawComplaints] = await Promise.all(
      authRole === "admin"
        ? [
            fetchJson<BackendBin[]>("/api/admin/bins", {
              headers: authHeader,
            }),
            fetchJson<BackendTruck[]>("/api/admin/trucks", {
              headers: authHeader,
            }),
            fetchJson<BackendComplaint[]>("/api/admin/complaints", {
              headers: authHeader,
            }),
          ]
        : [
            fetchJson<{ data?: BackendBin[] } | BackendBin[]>("/api/bins"),
            fetchJson<{ data?: BackendTruck[] } | BackendTruck[]>(
              "/api/trucks",
            ),
            fetchJson<BackendComplaint[]>("/api/user/my-complaints", {
              headers: authHeader,
            }),
          ],
    );

    const backendBins = Array.isArray(rawBins) ? rawBins : (rawBins.data ?? []);
    const mappedBins = backendBins.map((bin, index) => {
      const fallbackLng = DEFAULT_CITY_CENTER[0] + ((index % 6) - 2.5) * 0.008;
      const fallbackLat =
        DEFAULT_CITY_CENTER[1] + (Math.floor(index / 6) - 1) * 0.008;
      const computedFill =
        typeof bin.fillLevel === "number"
          ? bin.fillLevel
          : typeof bin.currentLoad === "number" &&
              typeof bin.capacity === "number" &&
              bin.capacity > 0
            ? Math.round((bin.currentLoad / bin.capacity) * 100)
            : 0;

      return {
        id: bin.binId ?? bin._id,
        label:
          bin.area ?? bin.landmark ?? bin.address ?? bin.binId ?? "Unnamed Bin",
        longitude: bin.location?.lng ?? fallbackLng,
        latitude: bin.location?.lat ?? fallbackLat,
        fill: Math.max(0, Math.min(100, computedFill)),
      } satisfies TwinBin;
    });

    const binIds = mappedBins.map((bin) => bin.id);
    const backendTrucks = Array.isArray(rawTrucks)
      ? rawTrucks
      : (rawTrucks.data ?? []);

    const mappedTrucks = backendTrucks.map((truck, index) => {
      const usedCapacity = truck.usedCapacity ?? 0;
      const totalCapacity = truck.totalCapacity ?? 1;
      const route =
        binIds.length >= 4
          ? [
              binIds[index % binIds.length],
              binIds[(index + 1) % binIds.length],
              binIds[(index + 2) % binIds.length],
              binIds[(index + 3) % binIds.length],
            ]
          : binIds;
      const firstRouteBin = mappedBins.find((bin) => bin.id === route[0]);

      return {
        id: truck._id,
        name: `${truck.regNo ?? "Truck"}${truck.driverName ? ` · ${truck.driverName}` : ""}`,
        status: truck.status === "BUSY" ? "busy" : "idle",
        capacity: Math.max(
          0,
          Math.min(100, Math.round((usedCapacity / totalCapacity) * 100)),
        ),
        route,
        routeIndex: 0,
        longitude:
          truck.currentLocation?.lng ??
          firstRouteBin?.longitude ??
          DEFAULT_CITY_CENTER[0],
        latitude:
          truck.currentLocation?.lat ??
          firstRouteBin?.latitude ??
          DEFAULT_CITY_CENTER[1],
      } satisfies FleetTruck;
    });

    const mappedComplaints = rawComplaints
      .map((complaint, index) => {
        const lat = complaint.location?.lat;
        const lng = complaint.location?.lng;
        const locationLabel =
          typeof lat === "number" && typeof lng === "number"
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : "Location unavailable";

        return {
          id: complaint._id ?? `R-${index + 1}`,
          title: complaint.issueType
            ? `Issue: ${complaint.issueType}`
            : "Citizen Complaint",
          description:
            complaint.issueType ?? "Citizen has reported a sanitation issue.",
          location: locationLabel,
          severity: inferSeverity(complaint.issueType),
          status: "pending",
          timestamp: formatRelativeTime(complaint.createdAt),
          imageUrl: complaint.image,
        } satisfies CitizenReport;
      })
      .reverse();

    setBins(mappedBins);
    setTrucks(mappedTrucks);
    setReports(mappedComplaints);
  }, [authToken, authRole]);

  const geoBins = useMemo(() => {
    return bins;
  }, [bins]);

  const binLookup = useMemo(() => {
    const map = new globalThis.Map<string, (typeof geoBins)[number]>();
    geoBins.forEach((bin) => map.set(bin.id, bin));
    return map;
  }, [geoBins]);

  const geoTrucks = useMemo(() => {
    return trucks.map((truck) => {
      const routeBin = binLookup.get(truck.route[truck.routeIndex]);
      return {
        ...truck,
        longitude:
          truck.longitude ?? routeBin?.longitude ?? DEFAULT_CITY_CENTER[0],
        latitude:
          truck.latitude ?? routeBin?.latitude ?? DEFAULT_CITY_CENTER[1],
      };
    });
  }, [trucks, binLookup]);

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
    if (!authReady || !authToken || !authRole) {
      setIsLoadingData(false);
      return;
    }

    let cancelled = false;

    async function runInitialLoad() {
      try {
        setDataError(null);
        setIsLoadingData(true);
        await loadOperationalData();
      } catch (error) {
        if (!cancelled) {
          setDataError(
            error instanceof Error
              ? error.message
              : "Unable to load backend data.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }

    runInitialLoad();

    return () => {
      cancelled = true;
    };
  }, [authReady, authToken, authRole, loadOperationalData]);

  useEffect(() => {
    if (!authReady || !authToken || !authRole || !simulationActive) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        await loadOperationalData();
        setDataError(null);
      } catch (error) {
        setDataError(
          error instanceof Error
            ? error.message
            : "Unable to refresh backend data.",
        );
      }
    }, 10000);

    return () => window.clearInterval(timer);
  }, [authReady, authToken, authRole, simulationActive, loadOperationalData]);

  useEffect(() => {
    if (!simulationActive || !geoBins.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setBins((prev) =>
        prev.map((bin) => {
          const delta = Math.random() > 0.65 ? 4 : 1.5;
          const fill = Math.min(100, Math.round((bin.fill + delta) * 10) / 10);
          return { ...bin, fill };
        }),
      );
    }, 6000);

    return () => window.clearInterval(timer);
  }, [simulationActive, geoBins.length]);

  useEffect(() => {
    if (!toastQueue.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(0, -1));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toastQueue]);

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

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const tasksByTruck = useMemo(() => {
    const map = new globalThis.Map<string, DriverTask[]>();
    driverTasks.forEach((task) => {
      if (!task.assignedTruckId || task.status === "completed") {
        return;
      }
      const existing = map.get(task.assignedTruckId) ?? [];
      existing.push(task);
      map.set(task.assignedTruckId, existing);
    });
    return map;
  }, [driverTasks]);

  const pushNotification = useCallback(
    (message: string, priority: TaskPriority) => {
      const item: DriverNotification = {
        id: makeId("notif"),
        message,
        priority,
        timestamp: formatRelativeTime(new Date().toISOString()),
        read: false,
      };

      setNotifications((prev) => [item, ...prev].slice(0, 50));
      setToastQueue((prev) => [item, ...prev].slice(0, 4));
    },
    [],
  );

  const findNearestIdleTruck = useCallback(
    (target: GeoPoint) => {
      const busyTruckIds = new Set(
        driverTasks
          .filter((task) => task.status !== "completed" && task.assignedTruckId)
          .map((task) => task.assignedTruckId as string),
      );

      const idleTrucks = geoTrucks.filter(
        (truck) => truck.status === "idle" && !busyTruckIds.has(truck.id),
      );

      const candidatePool = idleTrucks.length ? idleTrucks : geoTrucks;
      if (!candidatePool.length) {
        return null;
      }

      let nearest = candidatePool[0];
      let nearestDistance = toDistanceKm(target, {
        latitude: nearest.latitude,
        longitude: nearest.longitude,
      });

      candidatePool.slice(1).forEach((truck) => {
        const distance = toDistanceKm(target, {
          latitude: truck.latitude,
          longitude: truck.longitude,
        });
        if (distance < nearestDistance) {
          nearest = truck;
          nearestDistance = distance;
        }
      });

      return { truck: nearest, distanceKm: nearestDistance };
    },
    [driverTasks, geoTrucks],
  );

  const createTask = useCallback(
    (task: Omit<DriverTask, "id" | "createdAt">) => {
      const newTask: DriverTask = {
        ...task,
        id: makeId("task"),
        createdAt: Date.now(),
      };

      setDriverTasks((prev) => [newTask, ...prev].slice(0, 80));
      return newTask;
    },
    [],
  );

  const assignTaskFromBin = useCallback(
    (bin: TwinBin) => {
      const alreadyOpen = driverTasks.some(
        (task) =>
          task.source === "bin" &&
          task.locationLabel.includes(bin.id) &&
          task.status !== "completed",
      );
      if (alreadyOpen) {
        return;
      }

      const nearest = findNearestIdleTruck({
        latitude: bin.latitude,
        longitude: bin.longitude,
      });

      const task = createTask({
        title: `Bin ${bin.id} requires pickup`,
        description: `Fill level reached ${bin.fill}% near ${bin.label}.`,
        priority: "medium",
        status: "pending",
        source: "bin",
        locationLabel: `${bin.label} (${bin.id})`,
        location: { latitude: bin.latitude, longitude: bin.longitude },
        assignedTruckId: nearest?.truck.id ?? null,
        distanceKm: nearest ? Number(nearest.distanceKm.toFixed(2)) : null,
      });

      pushNotification(`🚨 Bin ${bin.id} is full near ${bin.label}`, "medium");
      if (task.assignedTruckId && nearest) {
        pushNotification(
          `🚛 ${nearest.truck.name} assigned (${nearest.distanceKm.toFixed(2)} km)`,
          "medium",
        );
      }
    },
    [createTask, driverTasks, findNearestIdleTruck, pushNotification],
  );

  const assignTaskFromComplaint = useCallback(
    (report: CitizenReport, coords: GeoPoint) => {
      const alreadyOpen = driverTasks.some(
        (task) =>
          task.source === "complaint" &&
          task.title.includes(report.id) &&
          task.status !== "completed",
      );
      if (alreadyOpen) {
        return;
      }

      const nearest = findNearestIdleTruck(coords);
      const priority: TaskPriority =
        report.severity === "high" ? "high" : "medium";

      const task = createTask({
        title: `Complaint ${report.id} requires action`,
        description: report.description,
        priority,
        status: "pending",
        source: "complaint",
        locationLabel: report.location,
        location: coords,
        assignedTruckId: nearest?.truck.id ?? null,
        distanceKm: nearest ? Number(nearest.distanceKm.toFixed(2)) : null,
      });

      pushNotification(
        `📍 Complaint reported near ${report.location}`,
        priority,
      );
      if (task.assignedTruckId && nearest) {
        pushNotification(
          `🚛 ${nearest.truck.name} assigned (${nearest.distanceKm.toFixed(2)} km)`,
          priority,
        );
      }
    },
    [createTask, driverTasks, findNearestIdleTruck, pushNotification],
  );

  useEffect(() => {
    geoBins.forEach((bin) => {
      if (bin.fill >= 80 && !alertedBinsRef.current.has(bin.id)) {
        alertedBinsRef.current.add(bin.id);
        assignTaskFromBin(bin);
      }
      if (bin.fill < 70 && alertedBinsRef.current.has(bin.id)) {
        alertedBinsRef.current.delete(bin.id);
      }
    });
  }, [assignTaskFromBin, geoBins]);

  useEffect(() => {
    reports.forEach((report) => {
      if (notifiedComplaintsRef.current.has(report.id)) {
        return;
      }

      const parsed = parseLatLng(report.location);
      const coords = parsed
        ? { latitude: parsed.lat, longitude: parsed.lng }
        : {
            latitude: DEFAULT_CITY_CENTER[1],
            longitude: DEFAULT_CITY_CENTER[0],
          };

      notifiedComplaintsRef.current.add(report.id);
      assignTaskFromComplaint(report, coords);
    });
  }, [assignTaskFromComplaint, reports]);

  function acceptTask(taskId: string) {
    setDriverTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "in-progress" } : task,
      ),
    );
    pushNotification("Driver accepted a task", "medium");
  }

  function completeTask(taskId: string) {
    setDriverTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "completed" } : task,
      ),
    );
    pushNotification("Task marked as completed", "medium");
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function resetSelection() {
    setSelectedBinId(null);
    setSelectedTruckId(null);
  }

  async function submitReport() {
    if (
      !locationInput.trim() ||
      !descriptionInput.trim() ||
      isImageUploading ||
      !authToken ||
      !authRole
    ) {
      return;
    }

    try {
      const parsedCoords = parseLatLng(locationInput.trim());
      const fallbackCenter = mapViewport.center ?? DEFAULT_CITY_CENTER;
      const locationPayload = parsedCoords ?? {
        lat: fallbackCenter[1],
        lng: fallbackCenter[0],
      };

      const complaintPath =
        authRole === "citizen" ? "/api/user/complaint" : "/api/complaints";

      await fetchJson<BackendComplaint>(complaintPath, {
        method: "POST",
        headers:
          authRole === "citizen"
            ? { Authorization: `Bearer ${authToken}` }
            : undefined,
        body: JSON.stringify({
          issueType: `${severityInput.toUpperCase()}: ${descriptionInput.trim()}`,
          image: uploadedImageUrl ?? undefined,
          location: locationPayload,
        }),
      });

      await loadOperationalData();
      setLocationInput("");
      setDescriptionInput("");
      setSeverityInput("low");
      setImageName("No image selected");
      setUploadedImageUrl(null);
      setImageUploadError(null);
      setDataError(null);
      setActiveNav("reports");
    } catch (error) {
      setDataError(
        error instanceof Error
          ? `Failed to create complaint: ${error.message}`
          : "Failed to create complaint",
      );
    }
  }

  async function uploadImageToCloudinary(file: File) {
    const uploadFolder = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER;

    try {
      setIsImageUploading(true);
      setImageUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (uploadFolder) {
        formData.append("folder", uploadFolder);
      }

      const response = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorPayload?.error ?? "Cloudinary upload failed");
      }

      const payload = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
      };

      if (!payload.secure_url) {
        throw new Error("Cloudinary response did not include secure_url");
      }

      setUploadedImageUrl(payload.secure_url);
    } catch (error) {
      setUploadedImageUrl(null);
      setImageUploadError(
        error instanceof Error
          ? error.message
          : "Image upload failed. Please retry.",
      );
    } finally {
      setIsImageUploading(false);
    }
  }

  async function cycleTruckStatus(truckId: string) {
    if (authRole !== "admin") {
      setDataError("Only admin can change truck status.");
      return;
    }

    const truck = trucks.find((item) => item.id === truckId);
    if (!truck) {
      return;
    }

    const nextBackendStatus = truck.status === "idle" ? "BUSY" : "IDLE";

    try {
      await fetchJson<{ message: string }>(`/api/trucks/${truckId}`, {
        method: "POST",
        body: JSON.stringify({ status: nextBackendStatus }),
      });
      await loadOperationalData();
      setDataError(null);
    } catch (error) {
      setDataError(
        error instanceof Error
          ? `Failed to update truck status: ${error.message}`
          : "Failed to update truck status",
      );
    }
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070f] px-4 text-[#f5f7ff]">
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          Restoring session...
        </p>
      </main>
    );
  }

  if (!authToken || !authRole) {
    return (
      <AuthPanel
        mode={authMode}
        setMode={setAuthMode}
        isSubmitting={authSubmitting}
        error={authError}
        onCitizenLogin={loginCitizen}
        onCitizenRegister={registerCitizen}
        onAdminLogin={loginAdmin}
      />
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#05070f] text-[#f5f7ff]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] gap-0 px-2 lg:px-4">
        <aside className="hidden h-full w-[304px] shrink-0 border border-white/10 bg-[#060b18] lg:sticky lg:top-0 lg:flex lg:flex-col">
          <div className="border-b border-white/10 bg-linear-to-r from-emerald-500/10 via-cyan-500/5 to-transparent px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#0d1529] shadow-[0_0_28px_rgba(34,211,238,0.24)]">
                <Image
                  src="/logo.svg"
                  alt="Swachh City logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none tracking-tight text-white">
                  Swachh City
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Digital Twin
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-[11px] font-medium text-emerald-300/90">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Real-time Operations
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigation
            </p>
          </div>

          <nav className="mt-2 flex-1 space-y-1.5 px-3 pb-4">
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
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${isActive ? "border-cyan-300/30 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.1)]" : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/6 hover:text-slate-100"}`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-cyan-300/15 text-cyan-200" : "bg-white/5 text-slate-400 group-hover:text-slate-200"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
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

          <div className="border-t border-white/10 px-4 py-4">
            <Card className="rounded-xl border-white/12 bg-[#0b1222]/90 shadow-[0_12px_36px_-20px_rgba(14,165,233,0.55)]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold leading-none text-white">
                      {authRole === "admin" ? "Admin User" : "Citizen User"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {authRole === "admin"
                        ? "Control Center"
                        : "Field Reporter"}
                    </p>
                    {authUserId ? (
                      <p className="mt-2 break-all rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] font-medium text-slate-400">
                        ID: {authUserId}
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto border border-white/10 bg-[#060913]">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#060913]/95 px-6 py-4 backdrop-blur-md">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {activeNav === "dashboard" && "System Overview"}
              {activeNav === "live-map" && "Digital Twin Live Map"}
              {activeNav === "driver" && "Driver Dispatch Center"}
              {activeNav === "fleet" && "Fleet Operations"}
              {activeNav === "reports" && "Citizen Reports Center"}
              {activeNav === "analytics" && "Analytics Dashboard"}
            </h1>
            <div className="relative flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSimulationActive((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300"
              >
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${simulationActive ? "bg-emerald-400" : "bg-slate-500"}`}
                />
                <span>
                  {simulationActive ? "Live Sync Active" : "Live Sync Paused"}
                </span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDataError(null);
                    await loadOperationalData();
                  } catch (error) {
                    setDataError(
                      error instanceof Error
                        ? error.message
                        : "Unable to refresh backend data.",
                    );
                  }
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative text-slate-300 transition hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 transition hover:bg-white/10"
              >
                Logout
              </button>

              {isNotificationOpen ? (
                <NotificationPanel
                  notifications={notifications}
                  onMarkAllRead={markAllNotificationsRead}
                  onClose={() => setIsNotificationOpen(false)}
                />
              ) : null}
            </div>
          </header>

          <div className="space-y-4 p-4 sm:p-5 lg:p-6">
            {isLoadingData ? (
              <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
                Loading live backend data...
              </p>
            ) : null}
            {dataError ? (
              <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {dataError}
              </p>
            ) : null}

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
                    uploadedImageUrl={uploadedImageUrl}
                    isImageUploading={isImageUploading}
                    imageUploadError={imageUploadError}
                    setLocationInput={setLocationInput}
                    setDescriptionInput={setDescriptionInput}
                    setSeverityInput={setSeverityInput}
                    setImageName={setImageName}
                    onUploadImage={uploadImageToCloudinary}
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

            {activeNav === "driver" ? (
              <DriverDashboard
                trucks={geoTrucks}
                bins={geoBins}
                tasks={driverTasks}
                onAcceptTask={acceptTask}
                onCompleteTask={completeTask}
                tasksByTruck={tasksByTruck}
              />
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
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${truck.status === "busy" || truck.status === "collecting" ? "bg-amber-500/16 text-amber-300" : truck.status === "en-route" ? "bg-cyan-500/18 text-cyan-300" : "bg-slate-500/20 text-slate-300"}`}
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
                      disabled={authRole !== "admin"}
                      className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    >
                      {authRole === "admin"
                        ? "Change Status"
                        : "Admin only action"}
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
                  uploadedImageUrl={uploadedImageUrl}
                  isImageUploading={isImageUploading}
                  imageUploadError={imageUploadError}
                  setLocationInput={setLocationInput}
                  setDescriptionInput={setDescriptionInput}
                  setSeverityInput={setSeverityInput}
                  setImageName={setImageName}
                  onUploadImage={uploadImageToCloudinary}
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
                    Live values from backend API.
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

      {toastQueue.length ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[360px] max-w-[calc(100vw-1.25rem)] flex-col gap-2">
          {toastQueue.map((item) => (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md transition ${item.priority === "high" ? "border-rose-300/35 bg-rose-500/15" : "border-amber-300/30 bg-amber-500/15"}`}
            >
              <p className="text-sm font-medium text-white">{item.message}</p>
              <p className="mt-1 text-[11px] text-slate-300">
                {item.timestamp}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function AuthPanel({
  mode,
  setMode,
  isSubmitting,
  error,
  onCitizenLogin,
  onCitizenRegister,
  onAdminLogin,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  isSubmitting: boolean;
  error: string | null;
  onCitizenLogin: (email: string, password: string) => Promise<void>;
  onCitizenRegister: (form: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
  }) => Promise<void>;
  onAdminLogin: (email: string, password: string) => Promise<void>;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerGender, setRegisterGender] = useState<
    "Male" | "Female" | "Other" | ""
  >("");

  async function submitCurrentMode() {
    if (mode === "citizen-login") {
      await onCitizenLogin(loginEmail.trim(), loginPassword);
      return;
    }

    if (mode === "admin-login") {
      await onAdminLogin(loginEmail.trim(), loginPassword);
      return;
    }

    await onCitizenRegister({
      name: registerName.trim(),
      email: registerEmail.trim(),
      password: registerPassword,
      phone: registerPhone.trim() || undefined,
      address: registerAddress.trim() || undefined,
      gender: registerGender || undefined,
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070f] px-4 py-8 text-[#f5f7ff]">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-linear-to-b from-[#131c33] to-[#0c1222] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#0e1730] shadow-[0_0_34px_rgba(34,211,238,0.28)]">
            <Image
              src="/logo.svg"
              alt="Swachh City logo"
              width={72}
              height={72}
              className="h-[4.25rem] w-[4.25rem] object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-[2rem] font-semibold leading-none text-white">
              Swachh City
            </h1>
            <p className="mt-1.5 text-sm font-medium text-cyan-200/85">
              Login / Register
            </p>
            <p className="mt-1 text-xs text-slate-400">
              API: {BACKEND_BASE_URL}
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/25 p-1">
          <button
            type="button"
            onClick={() => setMode("citizen-login")}
            className={`rounded-md px-2 py-2 text-xs ${mode === "citizen-login" ? "bg-white/12 text-white" : "text-slate-400"}`}
          >
            Citizen Login
          </button>
          <button
            type="button"
            onClick={() => setMode("citizen-register")}
            className={`rounded-md px-2 py-2 text-xs ${mode === "citizen-register" ? "bg-white/12 text-white" : "text-slate-400"}`}
          >
            Citizen Register
          </button>
          <button
            type="button"
            onClick={() => setMode("admin-login")}
            className={`rounded-md px-2 py-2 text-xs ${mode === "admin-login" ? "bg-white/12 text-white" : "text-slate-400"}`}
          >
            Admin Login
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await submitCurrentMode();
          }}
        >
          {mode !== "citizen-register" ? (
            <>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Email"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Password"
              />
            </>
          ) : (
            <>
              <input
                type="text"
                required
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Full name"
              />
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Email"
              />
              <input
                type="password"
                required
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Password"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={registerPhone}
                  onChange={(event) => setRegisterPhone(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                  placeholder="Phone (optional)"
                />
                <select
                  value={registerGender}
                  onChange={(event) =>
                    setRegisterGender(
                      event.target.value as "Male" | "Female" | "Other" | "",
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none focus:border-blue-400/60"
                >
                  <option value="">Gender (optional)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <input
                type="text"
                value={registerAddress}
                onChange={(event) => setRegisterAddress(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400/60"
                placeholder="Address (optional)"
              />
            </>
          )}

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-slate-200 disabled:opacity-70"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "citizen-register"
                ? "Register as Citizen"
                : mode === "admin-login"
                  ? "Login as Admin"
                  : "Login as Citizen"}
          </button>
        </form>
      </div>
    </main>
  );
}

function NotificationPanel({
  notifications,
  onMarkAllRead,
  onClose,
}: {
  notifications: DriverNotification[];
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  return (
    <Card className="absolute right-0 top-12 z-40 w-[360px] border-white/15 bg-[#0d1324]/95 shadow-[0_25px_70px_-25px_rgba(15,23,42,0.8)] backdrop-blur-xl">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white">Notifications</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="max-h-[360px] space-y-2 overflow-y-auto p-3">
          {!notifications.length ? (
            <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400">
              No notifications yet.
            </p>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border px-3 py-2 ${item.priority === "high" ? "border-rose-300/25 bg-rose-500/10" : "border-amber-300/20 bg-amber-500/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white">{item.message}</p>
                  {!item.read ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {item.timestamp}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DriverDashboard({
  trucks,
  bins,
  tasks,
  tasksByTruck,
  onAcceptTask,
  onCompleteTask,
}: {
  trucks: Array<FleetTruck & GeoPoint>;
  bins: Array<TwinBin & GeoPoint>;
  tasks: DriverTask[];
  tasksByTruck: Map<string, DriverTask[]>;
  onAcceptTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
}) {
  const openTasks = tasks.filter((task) => task.status !== "completed");

  const nearbyBinsByTruck = useMemo(() => {
    return trucks.map((truck) => {
      const nearest = [...bins]
        .map((bin) => ({
          bin,
          d: toDistanceKm(
            { latitude: truck.latitude, longitude: truck.longitude },
            { latitude: bin.latitude, longitude: bin.longitude },
          ),
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      return { truckId: truck.id, nearest };
    });
  }, [trucks, bins]);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <Card className="border-white/12 bg-[#111520]">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Assigned Tasks</h3>
            <Badge tone="info">{openTasks.length} open</Badge>
          </div>
          <div className="space-y-3">
            {!tasks.length ? (
              <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400">
                No active tasks. Simulation will generate tasks when bins become
                full or complaints arrive.
              </p>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAcceptTask={onAcceptTask}
                  onCompleteTask={onCompleteTask}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {trucks.map((truck) => {
          const active = tasksByTruck.get(truck.id) ?? [];
          const closest = nearbyBinsByTruck.find(
            (item) => item.truckId === truck.id,
          );

          return (
            <Card key={truck.id} className="border-white/12 bg-[#111520]">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    {truck.name}
                  </p>
                  <Badge tone={active.length ? "warning" : "success"}>
                    {active.length ? "Assigned" : "Idle"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Current load: {truck.capacity}%
                </p>
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
                  <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Nearby bins
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {(closest?.nearest ?? []).map((item) => (
                      <div
                        key={item.bin.id}
                        className="flex items-center justify-between"
                      >
                        <span>{item.bin.label}</span>
                        <span className="text-slate-400">
                          {item.d.toFixed(2)} km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onAcceptTask,
  onCompleteTask,
}: {
  task: DriverTask;
  onAcceptTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
}) {
  const statusTone =
    task.status === "completed"
      ? "success"
      : task.status === "in-progress"
        ? "info"
        : "warning";

  const priorityTone = task.priority === "high" ? "danger" : "warning";

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm font-semibold text-white">{task.title}</p>
        <Badge tone={priorityTone}>{task.priority.toUpperCase()}</Badge>
        <Badge tone={statusTone}>{task.status}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-300">{task.description}</p>
      <p className="mt-2 text-xs text-slate-400">{task.locationLabel}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.assignedTruckId ? (
          <Badge tone="info">Truck assigned</Badge>
        ) : (
          <Badge tone="neutral">Awaiting driver</Badge>
        )}
        {task.distanceKm !== null ? (
          <Badge tone="neutral">{task.distanceKm.toFixed(2)} km away</Badge>
        ) : null}

        {task.status === "pending" ? (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => onAcceptTask(task.id)}
          >
            Accept Task
          </Button>
        ) : null}
        {task.status === "in-progress" ? (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => onCompleteTask(task.id)}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Mark Completed
          </Button>
        ) : null}
      </div>
    </div>
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
                <MarkerPopup
                  className="min-w-[170px] border border-white/15 bg-[#0b1220]/95 px-3 py-2 text-slate-100 shadow-2xl backdrop-blur-md"
                  offset={22}
                >
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
              <MarkerPopup
                className="min-w-[190px] border border-cyan-300/20 bg-[#0b1220]/95 px-3 py-2 text-slate-100 shadow-2xl backdrop-blur-md"
                offset={22}
              >
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
  uploadedImageUrl,
  isImageUploading,
  imageUploadError,
  setLocationInput,
  setDescriptionInput,
  setSeverityInput,
  setImageName,
  onUploadImage,
  onSubmit,
}: {
  locationInput: string;
  descriptionInput: string;
  severityInput: Severity;
  imageName: string;
  uploadedImageUrl: string | null;
  isImageUploading: boolean;
  imageUploadError: string | null;
  setLocationInput: (v: string) => void;
  setDescriptionInput: (v: string) => void;
  setSeverityInput: (v: Severity) => void;
  setImageName: (v: string) => void;
  onUploadImage: (file: File) => Promise<void>;
  onSubmit: () => void;
}) {
  const previewUrl = uploadedImageUrl
    ? toCloudinaryPreview(uploadedImageUrl, 720, 380)
    : null;

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
          <p className="font-medium">
            {isImageUploading
              ? "Uploading to Cloudinary..."
              : "Click to upload image"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{imageName}</p>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              setImageName(file ? file.name : "No image selected");
              if (file) {
                await onUploadImage(file);
              }
            }}
          />
        </label>

        {uploadedImageUrl ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border border-emerald-400/30 bg-black/30">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Uploaded report preview"
                  className="h-44 w-full object-cover"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallback !== "1" && uploadedImageUrl) {
                      img.dataset.fallback = "1";
                      img.src = uploadedImageUrl;
                      return;
                    }
                    img.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                  Uploaded image could not be previewed. Use the link below.
                </div>
              )}
            </div>

            <a
              href={uploadedImageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 underline-offset-4 hover:underline"
            >
              Open full uploaded image
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        {imageUploadError ? (
          <p className="text-xs text-rose-300">{imageUploadError}</p>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isImageUploading}
          className="h-10 w-full rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-slate-200"
        >
          {isImageUploading ? "Please wait..." : "Submit Report"}
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
  const thumbnailUrl = report.imageUrl
    ? toCloudinaryPreview(report.imageUrl, 288, 168)
    : null;

  return (
    <div className="flex items-start justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {report.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          {report.description}
        </p>
        {report.imageUrl ? (
          <div className="mt-2 overflow-hidden rounded-md border border-white/10 bg-black/40">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={`Report evidence for ${report.title}`}
                className="h-28 w-full object-cover"
                onError={(event) => {
                  const img = event.currentTarget;
                  if (img.dataset.fallback !== "1" && report.imageUrl) {
                    img.dataset.fallback = "1";
                    img.src = report.imageUrl;
                    return;
                  }
                  img.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-28 items-center justify-center text-xs text-slate-400">
                Image preview unavailable
              </div>
            )}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>{report.location}</span>
          <span>{report.timestamp}</span>
          {report.imageUrl ? (
            <a
              href={report.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 underline-offset-4 hover:underline"
            >
              View image
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
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
