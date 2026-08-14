import { create } from "zustand";

export type NarrativeDay = {
  day: number;
  title?: string | null;
  narrative?: string | null;
};

type NarrativePayload = {
  days: NarrativeDay[];
};

type NarrativeState = {
  /** Hard reload may drop cached day prose — Option A session UI only. */
  byTripId: Record<string, NarrativePayload>;
  setNarrative: (tripId: string, payload: NarrativePayload) => void;
  getNarrative: (tripId: string) => NarrativePayload | undefined;
};

export const useNarrativeStore = create<NarrativeState>((set, get) => ({
  byTripId: {},
  setNarrative: (tripId, payload) =>
    set((state) => ({
      byTripId: { ...state.byTripId, [tripId]: payload },
    })),
  getNarrative: (tripId) => get().byTripId[tripId],
}));
