"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pedido,
  actualizarPedido,
  eliminarPedido,
  listenPedidosPorEstados,
  PedidoEstado,
  crearPedido,
} from "@/lib/pedidos";
import PedidoFormModal from "@/components/PedidoFormModal";
import { Edit, Trash2, AlertTriangle } from "lucide-react";

/** Evita content mismatches entre SSR y cliente */
function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Tipos robustos para fechas estilo Firestore/Web */
type FireTimestampLike = { toDate: () => Date };
type FireDateInput = string | number | Date | FireTimestampLike | null | undefined;

function hasToDate(x: unknown): x is FireTimestampLike {
  return !!x && typeof x === "object" && "toDate" in x && typeof (x as { toDate?: unknown }).toDate === "function";
}

function parseFechaPrometida(fp: FireDateInput): Date | null {
  if (!fp) return null;
  if (hasToDate(fp)) {
    const d = fp.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (fp instanceof Date) return Number.isNaN(fp.getTime()) ? null : fp;
  if (typeof fp === "number") {
    const d = new Date(fp);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof fp === "string") {
    const d = new Date(fp);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function diffDaysFromToday(target?: Date | null) {
  if (!target) return Infinity;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((t1 - t0) / (1000 * 60 * 60 * 24));
}

/** Extra: fecha creada segura (Timestamp | Date | string | number) */
function getCreatedAtDate(val: unknown): Date | null {
  if (hasToDate(val)) return parseFechaPrometida(val);
  if (val instanceof Date || typeof val === "string" || typeof val === "number") return parseFechaPrometida(val);
  return null;
}

export default function PedidosPage() {
  const hasMounted = useHasMounted();

  const [rows, setRows] = useState<Pedido[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenPedidosPorEstados(
      ["pendiente", "en_proceso", "terminado"],
      (data) => {
        setRows(data);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.clienteNombre?.toLowerCase() ?? "").includes(s) ||
        (r.estado ?? "").includes(s) ||
        (r.items?.some((i) => (i.nombre?.toLowerCase() ?? "").includes(s)) ?? false)
    );
  }, [q, rows]);

  const sorted = useMemo(() => {
    // Orden: los con fecha más próxima primero; vencidos arriba; sin fecha al final.
    return [...filtered].sort((a, b) => {
      const da = parseFechaPrometida((a as unknown as { fechaPrometida?: FireDateInput }).fechaPrometida);
      const db = parseFechaPrometida((b as unknown as { fechaPrometida?: FireDateInput }).fechaPrometida);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
  }, [filtered]);

  const subtotales = useMemo(() => {
    return sorted.reduce(
      (acc, p) => {
        acc.total += Number(p.total || 0);
        acc.saldo += Number(p.saldo || 0);
        return acc;
      },
      { total: 0, saldo: 0 }
    );
  }, [sorted]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (p: Pedido) => {
    setEditing(p);
    setOpen(true);
  };

  const onSubmit = async (
    payload: Omit<Pedido, "id" | "createdAt" | "updatedAt">,
    editingId?: string
  ) => {
    if (editingId) {
      await actualizarPedido(editingId, payload);
    } else {
      await crearPedido(payload);
    }
    setOpen(false);
  };

  const onDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("¿Eliminar pedido?")) return;
    await eliminarPedido(id);
  };

  const updateEstadoInline = async (p: Pedido, estado: PedidoEstado) => {
    await actualizarPedido(p.id!, { estado });
  };

  const formatMoney = (n?: number) =>
    hasMounted && typeof n === "number" ? `AR$ ${n.toLocaleString("es-AR")}` : "—";

  const rowClassesByEstado = (estado?: PedidoEstado) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "en_proceso":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "terminado":
        return "bg-green-50 dark:bg-green-900/20";
      case "entregado":
        return "bg-gray-50 dark:bg-gray-800/40";
      default:
        return "";
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar por cliente, estado o producto"
            className="border rounded px-3 py-2 bg-white dark:bg-gray-900"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            onClick={openNew}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
          >
            Nuevo pedido
          </button>
          <a href="/home/pedidos/entregados" className="underline">
            Ver entregados →
          </a>
        </div>
      </div>

      <div className="overflow-x-auto border rounded bg-white dark:bg-gray-900">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Producto</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Saldo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Prometida</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-4">Cargando...</td>
              </tr>
            ) : sorted.length ? (
              sorted.map((p) => {
                const dProm = parseFechaPrometida((p as unknown as { fechaPrometida?: FireDateInput }).fechaPrometida);
                const dias = diffDaysFromToday(dProm);
                const isSoon = dias <= 2 && dias >= 0;   // 0,1,2 días
                const isOverdue = dias < 0;              // vencido

                const createdAtDate = getCreatedAtDate((p as unknown as { createdAt?: unknown }).createdAt);

                return (
                  <tr
                    key={p.id}
                    className={`border-t align-top ${rowClassesByEstado(p.estado)} ${isOverdue ? "bg-red-50 dark:bg-red-900/30" : ""}`}
                  >
                    <td className="p-3">
                      {hasMounted && createdAtDate
                        ? createdAtDate.toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="p-3">
                      <div className="font-medium flex items-center gap-2">
                        {isSoon && (
                          <span className="inline-flex items-center justify-center" title="Entrega próxima">
                            <span className="relative inline-flex">
                              <span className="absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping bg-amber-400/60"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          </span>
                        )}
                        {isOverdue && (
                          <span title="Vencido" className="inline-flex">
                            <AlertTriangle className="h-4 w-4 text-red-600" aria-label="Vencido" />
                          </span>
                        )}
                        {p.clienteNombre}
                      </div>
                      {p.telefono && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {p.telefono}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {p.items?.[0]
                        ? `${p.items[0].cantidad} × ${p.items[0].nombre}`
                        : "—"}
                    </td>
                    <td className="p-3 text-right">{formatMoney(p.total)}</td>
                    <td className="p-3 text-right">{formatMoney(p.saldo)}</td>
                    <td className="p-3">
                      <select
                        className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                        value={p.estado}
                        onChange={(e) => updateEstadoInline(p, e.target.value as PedidoEstado)}
                      >
                        <option value="pendiente">pendiente</option>
                        <option value="en_proceso">en_proceso</option>
                        <option value="terminado">terminado</option>
                        <option value="entregado">entregado</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {hasMounted && dProm ? dProm.toLocaleDateString("es-AR") : "—"}
                      {hasMounted && (isSoon || isOverdue) && (
                        <div
                          className={`text-xs ${isOverdue ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"} ${isSoon ? "animate-pulse" : ""}`}
                        >
                          {isOverdue
                            ? `Vencido hace ${Math.abs(dias)} día(s)`
                            : dias === 0
                            ? "Entrega hoy"
                            : `Faltan ${dias} día(s)`}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-4">Sin resultados</td>
              </tr>
            )}
          </tbody>

          {/* Subtotales de lo visible (filtrado/ordenado) */}
          {!loading && sorted.length > 0 && (
            <tfoot className="text-sm font-medium bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <td className="p-3" colSpan={3}>
                  Subtotales ({sorted.length} pedido/s)
                </td>
                <td className="p-3 text-right">
                  {formatMoney(subtotales.total)}
                </td>
                <td className="p-3 text-right">
                  {formatMoney(subtotales.saldo)}
                </td>
                <td className="p-3" colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal para crear o editar */}
      <PedidoFormModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing ?? undefined}
        onSubmit={onSubmit}
      />
    </div>
  );
}
