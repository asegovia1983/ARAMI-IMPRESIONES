"use client";

import { useEffect, useMemo, useState } from "react";
import { Pedido, listenPedidosEntregados, actualizarPedido } from "@/lib/pedidos";
import { registrarIngresoPedido } from "@/lib/caja";

/** Extrae un mensaje legible desde cualquier error desconocido sin usar `any` */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const maybe = err as { message?: unknown };
    if (typeof maybe.message === "string") return maybe.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function PedidosEntregadosPage() {
  const [rows, setRows] = useState<Pedido[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  /** Método de pago ingresado por ID de pedido */
  const [metodoPago, setMetodoPago] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = listenPedidosEntregados((data) => {
      setRows(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.clienteNombre?.toLowerCase() ?? "").includes(s) ||
      (r.items?.some((i) => (i.nombre?.toLowerCase() ?? "").includes(s)) ?? false)
    );
  }, [q, rows]);

  const formatMoney = (n?: number) =>
    typeof n === "number" ? `AR$ ${n.toLocaleString("es-AR")}` : "—";

  async function marcarCobrado(p: Pedido) {
    try {
      if (!p.id) throw new Error("Pedido sin ID");
      const monto = Number(p.saldo || 0);
      const metodo = (p.id ? metodoPago[p.id] : undefined) ?? p.metodoPago ?? undefined;

      if (monto <= 0) {
        // Sin saldo: solo marcar como cobrado
        await actualizarPedido(p.id, { cobrado: true, metodoPago: metodo });
        alert("Pedido marcado como cobrado (no había saldo pendiente).");
        return;
      }

      // 1) Registrar ingreso en caja
      await registrarIngresoPedido({
        pedidoPath: `pedidos/${p.id}`,
        monto,
        metodoPago: metodo,
        descripcion: `Cobro pedido ${p.id}`,
      });

      // 2) Marcar cobrado
      await actualizarPedido(p.id, { cobrado: true, metodoPago: metodo });

      alert("¡Cobro registrado y pedido marcado como cobrado!");
    } catch (e: unknown) {
      alert(`Error al cobrar: ${getErrorMessage(e)}`);
    }
  }

  return (
    <div className="p-4 space-y-4 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pedidos entregados</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar por cliente o producto"
            className="border rounded px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <a href="/home/pedidos" className="underline">← Volver</a>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Producto</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Saldo</th>
              <th className="p-3">Cobrado</th>
              <th className="p-3">Método de pago</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="p-4">Cargando...</td></tr>
            ) : filtered.length ? (
              filtered.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3">
                    {p.createdAt?.toDate?.()?.toLocaleDateString?.("es-AR") ?? "—"}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{p.clienteNombre}</div>
                    {p.telefono && (
                      <div className="text-xs text-gray-500">{p.telefono}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {p.items?.[0] ? `${p.items[0].cantidad} × ${p.items[0].nombre}` : "—"}
                  </td>
                  <td className="p-3 text-right">{formatMoney(p.total)}</td>
                  <td className="p-3 text-right">{formatMoney(p.saldo)}</td>
                  <td className="p-3">{p.cobrado ? "Sí" : "No"}</td>
                  <td className="p-3">
                    <input
                      className="border rounded px-2 py-1"
                      placeholder="efectivo / transferencia / etc."
                      value={p.id ? (metodoPago[p.id] ?? p.metodoPago ?? "") : ""}
                      onChange={(e) => {
                        if (!p.id) return;
                        const val = e.target.value;
                        setMetodoPago((prev) => ({ ...prev, [p.id as string]: val }));
                      }}
                      disabled={p.cobrado}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      className={`px-3 py-1 rounded ${p.cobrado ? "bg-gray-300 text-gray-600" : "bg-black text-white"}`}
                      disabled={p.cobrado}
                      onClick={() => marcarCobrado(p)}
                    >
                      {p.cobrado ? "Cobrado" : "Registrar cobro"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="p-4">No hay pedidos entregados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
