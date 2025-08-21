import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

interface PedidoItem {
  cantidad: number;
  precioUnit: number;
  costoUnit: number;
  nombre: string;
}

interface Pedido {
  items?: PedidoItem[];
}

export async function getReporteMensual(year: number, month: number) {
  const start = Timestamp.fromDate(new Date(year, month - 1, 1, 0, 0, 0));
  const end = Timestamp.fromDate(new Date(year, month, 0, 23, 59, 59));

  const qPedidos = query(
    collection(db, "pedidos"),
    where("cobrado", "==", true),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end)
  );

  const snap = await getDocs(qPedidos);

  let ingresos = 0;
  let costos = 0;
  const detalleProductos: Record<string, { nombre: string; cant: number; ingreso: number; costo: number }> = {};

  snap.forEach((doc) => {
    const pedido = doc.data() as Pedido;
    (pedido.items || []).forEach((item: PedidoItem) => {
      const ingresoItem = item.cantidad * item.precioUnit;
      const costoItem = item.cantidad * item.costoUnit;
      ingresos += ingresoItem;
      costos += costoItem;

      if (!detalleProductos[item.nombre]) {
        detalleProductos[item.nombre] = { nombre: item.nombre, cant: 0, ingreso: 0, costo: 0 };
      }
      detalleProductos[item.nombre].cant += item.cantidad;
      detalleProductos[item.nombre].ingreso += ingresoItem;
      detalleProductos[item.nombre].costo += costoItem;
    });
  });

  const ganancia = ingresos - costos;
  const margen = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

  return {
    ingresos,
    costos,
    ganancia,
    margen,
    detalleProductos: Object.values(detalleProductos)
      .map((p) => ({ ...p, ganancia: p.ingreso - p.costo, margen: p.ingreso > 0 ? ((p.ingreso - p.costo) / p.ingreso) * 100 : 0 }))
      .sort((a, b) => b.ingreso - a.ingreso)
  };
}
