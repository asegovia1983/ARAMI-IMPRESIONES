"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Producto, getProductos, crearProducto, actualizarProducto, eliminarProducto, RecetaItem
} from "@/lib/productos";
import { listenComponentesActivos, type ComponenteCosto } from "@/lib/componentesCosto";

type Form = {
  id?: string;
  nombre: string;
  sku?: string;
  categoria?: string;
  precio: string;
  activo?: boolean;
  receta: RecetaItem[] | undefined;
};

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // Componentes (para armar receta)
  const [componentes, setComponentes] = useState<ComponenteCosto[]>([]);

  const [form, setForm] = useState<Form>({
    nombre: "", sku: "", categoria: "", precio: "", activo: true, receta: []
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getProductos();
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const unsub = listenComponentesActivos(setComponentes);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(it =>
      (it.nombre?.toLowerCase() ?? "").includes(s) ||
      (it.sku?.toLowerCase() ?? "").includes(s) ||
 (it.categoria?.toLowerCase() ?? "").includes(s)
    );
  }, [items, q]);

 // costo en vivo (local) a partir de la receta y componentes cargados
  const costoLive = useMemo(() => {
    if (!form.receta.length || !componentes.length) return 0;
    let total = 0;
    for (const r of form.receta) {
      const comp = componentes.find(c => c.id === r.componenteId && c.activo);
      if (comp && r.cantidad > 0) total += comp.costoUnit * r.cantidad;
    }
    return Number(total.toFixed(2));
  }, [form.receta, componentes]);

  const onNew = () => {
    setForm({ nombre: "", sku: "", categoria: "", precio: "", activo: true, receta: [] });
    setOpen(true);
  };

  const onEdit = (p: Producto) => {
    setForm({
      id: p.id,
      nombre: p.nombre,
      sku: p.sku ?? "",
      categoria: p.categoria ?? "",
      precio: String(p.precio ?? ""),
      activo: p.activo ?? true,
      receta: p.receta ?? []
    });
    setOpen(true);
  };

  const onDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("¿Eliminar producto?")) return;
    await eliminarProducto(id);
    const data = await getProductos();
    setItems(data);
  };

  const validar = (f: Form) => {
    const errs: string[] = [];
    if (!f.nombre.trim()) errs.push("Nombre es requerido");
    const precio = Number(f.precio);
    if (isNaN(precio) || precio < 0) errs.push("Precio de venta inválido");
 // receta puede estar vacía, pero se recomienda tenerla
    for (let i = 0; i < f.receta.length; i++) {
      const r = f.receta[i];
      if (!r.componenteId) errs.push(`Receta ítem #${i+1}: componente requerido`);
      if (!(r.cantidad > 0)) errs.push(`Receta ítem #${i+1}: cantidad debe ser > 0`);
    }
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validar(form);
    if (errs.length) return alert(errs.join("\n"));

    const payload = {
      nombre: form.nombre.trim(),
      sku: form.sku?.trim() || undefined,
      categoria: form.categoria?.trim() || undefined,
      precio: Number(form.precio),
      activo: Boolean(form.activo),
      receta: form.receta.length ? form.receta : undefined,
    };

    if (form.id) {
      await actualizarProducto(form.id, payload);
    } else {
      await crearProducto(payload);
    }

    setOpen(false);
    const data = await getProductos();
    setItems(data);
  };

 // manejo de receta
  const addRecetaItem = () => setForm(f => ({ ...f, receta: [...f.receta, { componenteId: "", cantidad: 1 }] }));
  const updateRecetaItem = (idx: number, patch: Partial<RecetaItem>) =>
    setForm(f => ({ ...f, receta: f.receta.map((r, i) => i === idx ? { ...r, ...patch } : r) }));
  const removeRecetaItem = (idx: number) =>
    setForm(f => ({ ...f, receta: f.receta.filter((_, i) => i !== idx) }));

  const formatMoney = (n?: number) => typeof n === "number" ? `AR$ ${n.toLocaleString("es-AR")}` : "—";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Productos</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Buscar por nombre, SKU o categoría"
            className="border rounded px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="bg-black text-white px-4 py-2 rounded" onClick={onNew}>Nuevo</button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Categoría</th>
              <th className="p-3 text-right">Costo calc.</th>
              <th className="p-3 text-right">Precio</th>
              <th className="p-3 text-center">Activo</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {loading ? (
              <tr><td className="p-4" colSpan={7}>Cargando...</td></tr>
            ) : filtered.length ? (
              filtered.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.nombre}</td>
                  <td className="p-3">{p.sku || "—"}</td>
                  <td className="p-3">{p.categoria || "—"}</td>
                  <td className="p-3 text-right">{formatMoney(p.costoCalculado)}</td>
                  <td className="p-3 text-right">{formatMoney(p.precio)}</td>
                  <td className="p-3 text-center">{p.activo ? "✓" : "✕"}</td>
                  <td className="p-3 text-right space-x-2">
                    <button className="underline" onClick={() => onEdit(p)}>Editar</button>
                    <button className="text-red-600 underline" onClick={() => onDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4" colSpan={7}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-[95%] max-w-3xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{form.id ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Nombre</label>
                  <input className="w-full border rounded px-3 py-2" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">SKU</label>
                  <input className="w-full border rounded px-3 py-2" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Categoría</label>
                  <input className="w-full border rounded px-3 py-2" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Precio venta (AR$)</label>
                  <input type="number" min={0} className="w-full border rounded px-3 py-2 text-right" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} required />
                </div>
                <div className="flex items-end gap-2">
                  <input id="activo" type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                  <label htmlFor="activo">Activo</label>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Receta (componentes de costo)</label>
                <div className="space-y-2">
                  {form.receta.map((r, idx) => (
                    <div key={idx} className="grid md:grid-cols-6 gap-2 items-end border rounded p-2">
                      <div className="md:col-span-4">
                        <label className="block text-xs mb-1">Componente</label>
                        <select
                          className="w-full border rounded px-2 py-2"
                          value={r.componenteId}
                          onChange={e => updateRecetaItem(idx, { componenteId: e.target.value })}
                          required
                        >
                          <option value="">— seleccionar —</option>
                          {componentes.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.unidad}) — AR$ {c.costoUnit.toLocaleString("es-AR")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Cantidad</label>
                        <input
                          type="number" min={0.0001} step="0.0001"
                          className="w-full border rounded px-2 py-2 text-right"
                          value={r.cantidad}
                          onChange={e => updateRecetaItem(idx, { cantidad: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button type="button" className="text-red-600 underline" onClick={() => removeRecetaItem(idx)}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="underline" onClick={addRecetaItem}>+ Agregar componente</button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Costo calculado (preview)</label>
                  <input className="w-full border rounded px-3 py-2 text-right" value={costoLive} readOnly />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">{form.id ? "Guardar cambios" : "Crear producto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
