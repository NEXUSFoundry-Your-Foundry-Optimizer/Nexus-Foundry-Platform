import { create } from "zustand";
import { ALERTS, type AlertRow, type TwinId } from "@/lib/nexus-data";

interface NexusState {
  user: { name: string; role: string; shift: string; plant: string };
  activeBatch: string;
  activeFurnace: string;
  alerts: AlertRow[];
  readIds: string[];
  focusedAlert: string | null;
  markAllRead: () => void;
  markRead: (id: string) => void;
  focusAlert: (id: string | null) => void;
  setBatch: (b: string) => void;
  lastSimulation: {
    twin: TwinId;
    pourTemp: number;
    risk: number;
    previousRisk: number;
    physicsValid: boolean;
    coolingRate: number;
    recommendation: string;
  } | null;
  setSimulation: (s: NexusState["lastSimulation"]) => void;
}

export const useNexus = create<NexusState>((set) => ({
  user: { name: "Arjun Mehta", role: "Senior Melt Operator", shift: "B — 14:00 to 22:00", plant: "Foundry Unit 2, Pune" },
  activeBatch: "AL-CB-001",
  activeFurnace: "Furnace 3",
  alerts: ALERTS,
  readIds: [],
  focusedAlert: null,
  markAllRead: () => set((s) => ({ readIds: s.alerts.map((a) => a.id) })),
  markRead: (id) => set((s) => ({ readIds: s.readIds.includes(id) ? s.readIds : [...s.readIds, id] })),
  focusAlert: (id) => set({ focusedAlert: id }),
  setBatch: (b) => set({ activeBatch: b }),
  lastSimulation: null,
  setSimulation: (s) => set({ lastSimulation: s }),
}));
