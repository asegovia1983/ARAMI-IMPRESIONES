"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Pedido, actualizarPedido, eliminarPedido, listenPedidosPorEstados, PedidoEstado, crearPedido
} from "@/lib/pedidos";
import PedidoFormModal from "@/components/PedidoFormModal";

export default function PedidosPage() {
  const [rows, setRows] = useState<Pedido[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenPedidosPorEstados(
      ["pendiente", "en_proceso", "terminado"],
      (data) => { setRows(data); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.clienteNombre?.toLowerCase() ?? "").includes(s) ||
      (r.estado ?? "").includes(s) ||
      (r.items?.some(i => (i.nombre?.toLowerCase() ?? "").includes(s)) ?? false)
    );
  }, [q, rows]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Pedido) => { setEditing(p); setOpen(true); };

  const onSubmit = async (payload: Omit<Pedido,"id"|"createdAt"|"updatedAt">, editingId?: string) => {
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

  const formatMoney = (n?: number) => typeof n === "number" ? `AR$ ${n.toLocaleString("es-AR")}` : "—";

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-900 ">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pedidos</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar por cliente, estado o producto"
            className="border rounded px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          
          <button
            onClick={openNew}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
          >
            Nuevo pedido
          </button>
          <a href="/home/pedidos/entregados" className="underline">Ver entregados →</a>
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
              <th className="p-3">Estado</th>
              <th className="p-3">Prometida</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="p-4">Cargando...</td></tr>
            ) : filtered.length ? (
              filtered.map(p => (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3">{p.createdAt?.toDate?.().toLocaleDateString?.("es-AR") ?? "—"}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.clienteNombre}</div>
                    {p.telefono && <div className="text-xs text-gray-500">{p.telefono}</div>}
                  </td>
                  <td className="p-3">{p.items?.[0] ? `${p.items[0].cantidad} × ${p.items[0].nombre}` : "—"}</td>
                  <td className="p-3 text-right">{formatMoney(p.total)}</td>
                  <td className="p-3 text-right">{formatMoney(p.saldo)}</td>
                  <td className="p-3">
                    <select
                      className="border rounded px-2 py-1"
                      value={p.estado}
                      onChange={(e) => updateEstadoInline(p, e.target.value as PedidoEstado)}
                    >
                      <option value="pendiente">pendiente</option>
                      <option value="en_proceso">en_proceso</option>
                      <option value="terminado">terminado</option>
                      <option value="entregado">entregado</option>
                    </select>
                  </td>
                  <td className="p-3">{p.fechaPrometida || "—"}</td>
                  <td className="p-3 text-right space-x-2">
                    <button className="underline" onClick={() => openEdit(p)}>Editar</button>
                    <button className="text-red-600 underline" onClick={() => onDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="p-4">Sin resultados</td></tr>
            )}
          </tbody>
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
