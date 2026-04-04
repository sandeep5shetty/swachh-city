import type {
  CitizenReport,
  Hotspot,
  WasteBin,
  WasteTruck,
} from "@/types/waste";

export const cityName = "Bangalore East Cluster";

export const initialBins: WasteBin[] = [
  {
    id: "bin-1",
    name: "Indiranagar Market Bin",
    ward: "Ward 91",
    zone: "Retail spine",
    fillLevel: 32,
    x: 16,
    y: 24,
    lastServiced: "12 min ago",
  },
  {
    id: "bin-2",
    name: "CMH Road Bin",
    ward: "Ward 92",
    zone: "Transit corridor",
    fillLevel: 48,
    x: 38,
    y: 18,
    lastServiced: "18 min ago",
  },
  {
    id: "bin-3",
    name: "Ulsoor Lake Bin",
    ward: "Ward 93",
    zone: "Tourist front",
    fillLevel: 84,
    x: 58,
    y: 28,
    lastServiced: "44 min ago",
  },
  {
    id: "bin-4",
    name: "Shivajinagar Bin",
    ward: "Ward 94",
    zone: "Commercial block",
    fillLevel: 66,
    x: 74,
    y: 20,
    lastServiced: "22 min ago",
  },
  {
    id: "bin-5",
    name: "Frazer Town Bin",
    ward: "Ward 95",
    zone: "Dense housing",
    fillLevel: 88,
    x: 26,
    y: 66,
    lastServiced: "51 min ago",
  },
  {
    id: "bin-6",
    name: "MG Road Bin",
    ward: "Ward 96",
    zone: "CBD corridor",
    fillLevel: 18,
    x: 56,
    y: 66,
    lastServiced: "9 min ago",
  },
];

export const hotspots: Hotspot[] = [
  {
    id: "hotspot-1",
    label: "Weekend spillover",
    severity: "high",
    x: 60,
    y: 32,
    size: 16,
  },
  {
    id: "hotspot-2",
    label: "Food-street cluster",
    severity: "medium",
    x: 30,
    y: 58,
    size: 14,
  },
];

export const initialTrucks: WasteTruck[] = [
  {
    id: "truck-1",
    name: "Route A-17",
    status: "routing",
    routeIds: ["bin-1", "bin-3", "bin-5", "bin-2"],
    routeIndex: 0,
    x: 16,
    y: 24,
    capacity: "82%",
    activeBinId: "bin-1",
  },
  {
    id: "truck-2",
    name: "Route B-04",
    status: "idle",
    routeIds: ["bin-6", "bin-4", "bin-2"],
    routeIndex: 0,
    x: 56,
    y: 66,
    capacity: "54%",
    activeBinId: "bin-6",
  },
];

export const initialReports: CitizenReport[] = [
  {
    id: "report-1",
    location: "Indiranagar 100 ft Road",
    description: "Overflowing bin near the bus stop needs urgent pickup.",
    imageName: "street-bin.jpg",
    createdAt: "08:42",
    status: "Received",
  },
  {
    id: "report-2",
    location: "Ulsoor Lake promenade",
    description:
      "Waste scattered around the seating area after the morning crowd.",
    imageName: "promenade.png",
    createdAt: "07:18",
    status: "Assigned",
  },
];
