// src/lib/pedidos.ts
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query,
  serverTimestamp, updateDoc, Timestamp, where, Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming firebase.ts exports the db instance

export type PedidoEstado = "pendiente" | "en_proceso" | "terminado" | "entregado";
 
export type PedidoItem = {
  productoId?: string;
  nombre: string;
  opciones?: Record<string, string>;
  cantidad: number;
  precioUnit: number;
  costoUnit?: number;
};

export type Pedido = {
  id?: string;
  clienteId?: string;
  clienteNombre: string;
  telefono?: string;
  estado: PedidoEstado;
  items: PedidoItem[];
  subtotal: number;
  descuento: number;
  anticipo: number;
  total: number;
  saldo: number;
  observaciones?: string;
  fechaPrometida?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  entregadoAt?: Timestamp | null;
  cobrado: boolean;
  metodoPago?: string | null;
};

const COL: string = "pedidos";
const cleanUndefined = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

// Listar por un conjunto de estados (para la lista principal)
export function listenPedidosPorEstados(
  estados: PedidoEstado[],
  cb: (data: Pedido[]) => void
): Unsubscribe {
  // Nota: evitamos orderBy para no requerir índice compuesto
  const qy = query(collection(db, COL), where("estado", "in", estados));
  return onSnapshot(qy, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Pedido) } as Pedido));
    cb(rows);
  });
}

// Solo entregados
export function listenPedidosEntregados(cb: (data: Pedido[]) => void): Unsubscribe {
  const qy = query(collection(db, COL), where("estado", "==", "entregado")); // Assuming "entregado" is a valid state string
  return onSnapshot(qy, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Pedido) } as Pedido));
    cb(rows);
  });
}

export async function crearPedido(p: Omit<Pedido, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COL), {
    ...cleanUndefined(p),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function actualizarPedido(id: string, p: Partial<Pedido>) {
  const ref = doc(db, COL, id);
  return updateDoc(ref, { ...cleanUndefined(p), updatedAt: serverTimestamp() });
}

export async function eliminarPedido(id: string) {
  const ref = doc(db, COL, id);
  return deleteDoc(ref);
}
