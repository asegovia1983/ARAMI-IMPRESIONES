"use client";

import type { ComponenteCosto, TipoComponente } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { listenComponentesActivos, crearComponente, actualizarComponente, eliminarComponente } from "@/lib/componentesCosto";

export default function ComponentesCostoPage() {
  const [rows, setRows] = useState<ComponenteCosto[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  type Form = ComponenteCosto & { costoUnit: string };
  const [form, setForm] = useState<Form>({ nombre: "", tipo: "insumo", unidad: "", costoUnit: "", activo: true });

  useEffect(() => {
    const unsub = listenComponentesActivos(setRows);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.nombre?.toLowerCase() ?? "").includes(s) ||
      (r.unidad?.toLowerCase() ?? "").includes(s) ||
      (r.tipo?.toLowerCase() ?? "").includes(s)
    );
  }, [q, rows]);

  const onNew = () => {
    setForm({ nombre: "", tipo: "insumo", unidad: "", costoUnit: "", activo: true, id: undefined });
    setOpen(true);
  };

  const onEdit = (c: ComponenteCosto) => {
    setForm({ 
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      unidad: c.unidad,
      costoUnit: String(c.costoUnit),
      activo: c.activo ?? true,
    });
    setOpen(true);
  };
  
  const onDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("¿Eliminar componente?")) return;
    await eliminarComponente(id);
  };

  const validar = (f: Form) => {
    const errs: string[] = [];
    if (!f.nombre.trim()) errs.push("Nombre es requerido");
    if (!f.unidad.trim()) errs.push("Unidad es requerida");
    const cu = Number(f.costoUnit);
    if (isNaN(cu) || cu < 0) errs.push("Costo unitario inválido");
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validar(form);
    if (errs.length) return alert(errs.join("\n"));

    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      unidad: form.unidad.trim(),
      costoUnit: Number(form.costoUnit),
      activo: Boolean(form.activo),
    };

    if (form.id) await actualizarComponente(form.id, payload);
    else await crearComponente(payload);

    setOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Componentes de Costo</h1>
        <div className="flex gap-2">
          <input
            placeholder="Buscar por nombre, tipo o unidad"
            className="border rounded px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="bg-black text-white px-4 py-2 rounded" onClick={onNew}>Nuevo</button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Unidad</th>
              <th className="p-3 text-right">Costo unit.</th>
              <th className="p-3 text-center">Activo</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {filtered.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.nombre}</td>
                <td className="p-3">{c.tipo}</td>
                <td className="p-3">{c.unidad}</td>
                <td className="p-3 text-right">AR$ {c.costoUnit.toLocaleString("es-AR")}</td>
                <td className="p-3 text-center">{c.activo ? "✓" : "✕"}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="underline" onClick={() => onEdit(c)}>Editar</button>
                  <button className="underline text-red-600" onClick={() => onDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} className="p-3">Sin componentes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-[95%] max-w-lg space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{form.id ? "Editar componente" : "Nuevo componente"}</h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Nombre</label>
                <input className="w-full border rounded px-3 py-2" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Tipo</label>
                  <select className="w-full border rounded px-3 py-2" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoComponente }))}>
                    <option value="insumo">insumo</option>
                    <option value="variable">variable</option>
                    <option value="fijo">fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Unidad</label>
                  <input className="w-full border rounded px-3 py-2" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Costo unit. (AR$)</label>
                  <input type="number" min={0} className="w-full border rounded px-3 py-2 text-right" value={form.costoUnit} onChange={e => setForm(f => ({ ...f, costoUnit: e.target.value }))} required />
                </div>
                <div className="flex items-end gap-2">
                  <input id="activo" type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                  <label htmlFor="activo">Activo</label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">{form.id ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
