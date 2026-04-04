export type BinState = "empty" | "medium" | "full";

export type TruckStatus = "routing" | "servicing" | "idle";

export type HotspotSeverity = "medium" | "high";

export interface WasteBin {
  id: string;
  name: string;
  ward: string;
  zone: string;
  fillLevel: number;
  x: number;
  y: number;
  lastServiced: string;
}

export interface WasteTruck {
  id: string;
  name: string;
  status: TruckStatus;
  routeIds: string[];
  routeIndex: number;
  x: number;
  y: number;
  capacity: string;
  activeBinId?: string;
}

export interface Hotspot {
  id: string;
  label: string;
  severity: HotspotSeverity;
  x: number;
  y: number;
  size: number;
}

export interface CitizenReport {
  id: string;
  location: string;
  description: string;
  imageName: string;
  createdAt: string;
  status: string;
}
