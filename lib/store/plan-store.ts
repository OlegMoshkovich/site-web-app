import { create } from 'zustand';

export interface PlanPosition {
  x: number;
  y: number;
}

export interface AnchorPoint {
  x: number;
  y: number;
}

interface PlanState {
  planPosition: PlanPosition;
  zoomScale: number;
  anchor: AnchorPoint | null;
  setPlanPosition: (position: PlanPosition) => void;
  setZoomScale: (scale: number) => void;
  setAnchor: (anchor: AnchorPoint | null) => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  planPosition: { x: 0, y: 0 },
  zoomScale: 1,
  anchor: null,
  setPlanPosition: (position) => set({ planPosition: position }),
  setZoomScale: (scale) => set({ zoomScale: scale }),
  setAnchor: (anchor) => set({ anchor }),
}));