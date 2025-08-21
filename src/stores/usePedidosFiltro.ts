// src/stores/usePedidosFiltro.ts
import { create } from "zustand";

type State = { q: string; setQ: (q: string) => void };
export const usePedidosFiltro = create<State>((set) => ({
  q: "",
  setQ: (q) => set({ q }),
}));
