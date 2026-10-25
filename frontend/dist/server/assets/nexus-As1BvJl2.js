import { create } from "zustand";
const useNexus = create((set) => ({
  user: { name: "Arjun Mehta", role: "Senior Melt Operator", shift: "B — 14:00 to 22:00", plant: "Foundry Unit 2, Pune" },
  activeBatch: "AL-CB-001",
  activeFurnace: "Furnace 3",
  alerts: [],
  readIds: [],
  focusedAlert: null,
  markAllRead: () => set((s) => ({ readIds: s.alerts.map((a) => a.id) })),
  markRead: (id) => set((s) => ({ readIds: s.readIds.includes(id) ? s.readIds : [...s.readIds, id] })),
  focusAlert: (id) => set({ focusedAlert: id }),
  setBatch: (b) => set({ activeBatch: b }),
  lastSimulation: null,
  setSimulation: (s) => set({ lastSimulation: s })
}));
export {
  useNexus as u
};
