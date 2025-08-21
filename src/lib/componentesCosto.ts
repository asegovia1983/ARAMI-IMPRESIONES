// src/lib/componentesCosto.ts
import {
    addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query,
    serverTimestamp, updateDoc, where,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  export type ComponenteCosto = {
    id?: string;
    nombre: string;         // p.ej. "Hoja sublimación A4"
    tipo: "insumo" | "variable" | "fijo";
    unidad: string;         // "hoja" | "ml" | "kWh" | "hora" | "unidad"
    costoUnit: number;      // costo por unidad definida
    activo: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
  
  const COL = "componentesCosto";
  
  const cleanUndefined = (o: Partial<ComponenteCosto>) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  
  export async function getComponentesActivos(): Promise<ComponenteCosto[]> {
    const q = query(collection(db, COL), where("activo", "==", true), orderBy("createdAt", "desc"), limit(1000));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as ComponenteCosto) }));
  }
  
   
  export function listenComponentesActivos(cb: (rows: ComponenteCosto[]) => void) {
    const q = query(collection(db, "componentesCosto"), where("activo", "==", true), limit(1000));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as ComponenteCosto) }))));
  }
  
  export async function crearComponente(p: Omit<ComponenteCosto, "id"|"createdAt"|"updatedAt">) {
    return addDoc(collection(db, COL), { ...cleanUndefined(p), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  
  export async function actualizarComponente(id: string, p: Partial<ComponenteCosto>) {
    const ref = doc(db, COL, id);
    return updateDoc(ref, { ...cleanUndefined(p), updatedAt: serverTimestamp() });
  }
  
  export async function eliminarComponente(id: string) {
    const ref = doc(db, COL, id);
    return deleteDoc(ref);
  }
  