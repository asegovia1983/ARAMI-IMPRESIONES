// src/lib/productos.ts
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where, Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { ComponenteCosto } from "./componentesCosto";

export type RecetaItem = {
  componenteId: string;
  cantidad: number; // en unidades de ese componente (ml, kWh, hojas, hora, etc.)
};

export type Producto = {
  id?: string;
  nombre: string;
  sku?: string;
  categoria?: string;
  precio: number;               // precio de venta unitario
  activo: boolean;
  // NUEVO:
  receta?: RecetaItem[];        // lista de componentes
  costoCalculado?: number;      // calculado desde receta
  createdAt?: any;
  updatedAt?: any;
};

const COL = "productos";
const cleanUndefined = (o: any) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

// --- utils: cargar componente ---
async function getComponenteById(id: string): Promise<ComponenteCosto | null> {
  const ref = doc(db, "componentesCosto", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as ComponenteCosto;
}

// Calcula el costo total de una receta trayendo componentes
export async function calcularCostoDesdeReceta(receta?: RecetaItem[]): Promise<number> {
  if (!receta || !receta.length) return 0;
  let total = 0;
  for (const r of receta) {
    if (!r?.componenteId || !r?.cantidad || r.cantidad <= 0) continue;
    const comp = await getComponenteById(r.componenteId);
    if (comp && comp.activo) {
      total += comp.costoUnit * r.cantidad;
    }
  }
  return Number(Number(total).toFixed(2));
}

export async function getProductos(): Promise<Producto[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export function listenProductosActivos(cb: (rows: Producto[]) => void) {
  const q = query(collection(db, "productos"), where("activo", "==", true), limit(1000));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
}

// crear/actualizar calculando costoCalculado automáticamente
export async function crearProducto(p: Omit<Producto, "id"|"createdAt"|"updatedAt"|"costoCalculado">) {
  const costoCalculado = await calcularCostoDesdeReceta(p.receta);
  return addDoc(collection(db, COL), {
    ...cleanUndefined({ ...p, costoCalculado }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function actualizarProducto(id: string, p: Partial<Producto>) {
  const ref = doc(db, COL, id);
  const costoCalculado =
    p.receta ? await calcularCostoDesdeReceta(p.receta) : undefined;
  return updateDoc(ref, {
    ...cleanUndefined({ ...p, ...(costoCalculado !== undefined && { costoCalculado }) }),
    updatedAt: serverTimestamp(),
  });
}

export async function eliminarProducto(id: string) {
  const ref = doc(db, COL, id);
  return deleteDoc(ref);
}
