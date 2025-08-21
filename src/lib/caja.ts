// src/lib/caja.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type MovimientoCaja = {
  tipo: "ingreso" | "egreso";
  origen: "pedido" | "insumo" | "gasto_fijo" | "ajuste";
  referenciaId?: string; // ej: "pedidos/XYZ"
  monto: number;
  descripcion?: string;
  metodoPago?: string; // You might want a more specific type here if you have predefined payment methods
  fecha?: Date; // Using Date to represent a timestamp
};

const COL = "movimientosCaja"; // Consider moving this to a constants file if used elsewhere
const cleanUndefined = (o: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export async function registrarIngresoPedido(args: {
  pedidoPath: string;
  monto: number;
  metodoPago?: string;
  descripcion?: string;
}) {
  return addDoc(collection(db, COL), cleanUndefined({
    tipo: "ingreso",
    origen: "pedido",
    referenciaId: args.pedidoPath,
    monto: args.monto,
    metodoPago: args.metodoPago,
    descripcion: args.descripcion,
    fecha: serverTimestamp(),
    createdAt: serverTimestamp(),
  }));
}
