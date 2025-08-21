"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pedido, PedidoEstado, PedidoItem } from "@/lib/pedidos";
import { listenProductosActivos, type Producto } from "@/lib/productos";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Pedido>; // si viene, es edición
  onSubmit: (payload: Omit<Pedido, "id"|"createdAt"|"updatedAt">, editingId?: string) => Promise<void>;
};

const ESTADOS: PedidoEstado[] = ["pendiente", "en_proceso", "terminado", "entregado"];

export default function PedidoFormModal({ open, onClose, initial, onSubmit }: Props) {
  const [estado, setEstado] = useState<PedidoEstado>("pendiente");
  const [clienteNombre, setClienteNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  // Productos del catálogo
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [prodSeleccionadoId, setProdSeleccionadoId] = useState<string>("");

  // Ítem único
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioUnit, setPrecioUnit] = useState<number>(0);
  const [costoUnit, setCostoUnit] = useState<number>(0);

  // Totales y otros
  const [descuento, setDescuento] = useState<string>("0");
  const [anticipo, setAnticipo] = useState<string>("0");
  const [observaciones, setObservaciones] = useState("");
  const [fechaPrometida, setFechaPrometida] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("");
  const [cobrado, setCobrado] = useState<boolean>(false);

  // Cargar productos activos cuando abre
  useEffect(() => {
    if (!open) return;
    setLoadingProds(true);
    const unsub = listenProductosActivos((rows) => {
      setProductos(rows);
      setLoadingProds(false);
    });
    return () => unsub();
  }, [open]);

  // Inicialización (crear/editar)
  useEffect(() => {
    if (!open) return;

    if (initial?.id) {
      setEstado(initial.estado ?? "pendiente");
      setClienteNombre(initial.clienteNombre ?? "");
      setTelefono(initial.telefono ?? "");
      const it = (initial.items && initial.items[0]) || undefined;
      setProdSeleccionadoId(it?.productoId ?? "");
      setCantidad(it?.cantidad ?? 1);
      setPrecioUnit(Number(it?.precioUnit ?? 0));
      setCostoUnit(Number(it?.costoUnit ?? 0));
      setDescuento(String(initial.descuento ?? 0));
      setAnticipo(String(initial.anticipo ?? 0));
      setObservaciones(initial.observaciones ?? "");
      setFechaPrometida(initial.fechaPrometida ?? "");
      setMetodoPago(initial.metodoPago ?? "");
      setCobrado(Boolean(initial.cobrado));
    } else {
      setEstado("pendiente");
      setClienteNombre("");
      setTelefono("");
      setProdSeleccionadoId("");
      setCantidad(1);
      setPrecioUnit(0);
      setCostoUnit(0);
      setDescuento("0");
      setAnticipo("0");
      setObservaciones("");
      setFechaPrometida("");
      setMetodoPago("");
      setCobrado(false);
    }
  }, [open, initial]);

  // Autocompletar precio y costo al elegir producto
  useEffect(() => {
    if (!prodSeleccionadoId) return;
    const p = productos.find(x => x.id === prodSeleccionadoId);
    if (p) {
      setPrecioUnit(Number(p.precio ?? 0));
      // 👇 costo tomado desde receta ya calculada
      setCostoUnit(Number(p.costoCalculado ?? 0));
      if (!initial?.id) setCantidad(1);
    }
  }, [prodSeleccionadoId, productos, initial?.id]);

  const subtotal = useMemo(() => Number(precioUnit || 0) * Number(cantidad || 0), [precioUnit, cantidad]);
  const total = useMemo(() => Math.max(0, subtotal - Number(descuento || 0)), [subtotal, descuento]);
  const saldo = useMemo(() => Math.max(0, total - Number(anticipo || 0)), [total, anticipo]);

  const validar = (): string[] => {
    const errs: string[] = [];
    if (!clienteNombre.trim()) errs.push("El nombre del cliente es requerido.");
    if (!prodSeleccionadoId) errs.push("Debe seleccionar un producto.");
    if (Number(cantidad) <= 0) errs.push("La cantidad debe ser mayor a 0.");
    if (Number(precioUnit) < 0) errs.push("Precio inválido.");
    if (Number(costoUnit) < 0) errs.push("Costo inválido.");
    if (Number(descuento) < 0) errs.push("Descuento inválido.");
    if (Number(anticipo) < 0) errs.push("Anticipo inválido.");
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validar();
    if (errs.length) {
      alert(errs.join("\n"));
      return;
    }

    const prod = productos.find(p => p.id === prodSeleccionadoId)!;
    const item: PedidoItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: Number(cantidad),
      precioUnit: Number(precioUnit),
      costoUnit: Number(costoUnit),
    };

    // ⚠️ NO mandamos undefined: usamos spreads condicionales
    const payload: Omit<Pedido, "id"|"createdAt"|"updatedAt"> = {
      clienteNombre: clienteNombre.trim(),
      estado,
      items: [item], // 1 ítem
      subtotal,
      descuento: Number(descuento || 0),
      anticipo: Number(anticipo || 0),
      total,
      saldo,
      ...(telefono.trim() && { telefono: telefono.trim() }),
      ...(observaciones.trim() && { observaciones: observaciones.trim() }),
      ...(fechaPrometida && { fechaPrometida }),
      ...(metodoPago && { metodoPago }),
      entregadoAt: null,
      cobrado,
    };

    await onSubmit(payload, initial?.id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[95%] max-w-3xl rounded shadow p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            {initial?.id ? "Editar pedido" : "Nuevo pedido"}
          </h2>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Cliente</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Nombre y apellido"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Teléfono</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="11 1234-5678"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
            </div>
          </div>

          {/* Estado + fecha prometida + pago */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Estado</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={estado}
                onChange={(e) => setEstado(e.target.value as PedidoEstado)}
              >
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Fecha prometida</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={fechaPrometida}
                onChange={e => setFechaPrometida(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Método de pago</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="efectivo / transferencia / etc."
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
              />
            </div>
          </div>

          {/* Producto único (desde catálogo) */}
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Producto</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={prodSeleccionadoId}
                onChange={(e) => setProdSeleccionadoId(e.target.value)}
                required
                disabled={loadingProds || productos.length === 0}
              >
                {loadingProds ? (
                  <option value="">Cargando productos…</option>
                ) : productos.length === 0 ? (
                  <option value="">No hay productos activos</option>
                ) : (
                  <>
                    <option value="">— Seleccionar —</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.sku ? `(${p.sku})` : ""} — AR$ {p.precio?.toLocaleString("es-AR")}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Cantidad</label>
              <input
                type="number" min={1}
                className="w-full border rounded px-3 py-2 text-right"
                value={cantidad}
                onChange={e => setCantidad(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Precio unit. (AR$)</label>
              <input
                type="number" min={0}
                className="w-full border rounded px-3 py-2 text-right"
                value={precioUnit}
                onChange={e => setPrecioUnit(Number(e.target.value))}
                required
                // Si querés bloquearlo: readOnly
              />
            </div>
          </div>

          {/* Costo, totales */}
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm mb-1">Costo unit. (AR$)</label>
              <input
                type="number" min={0}
                className="w-full border rounded px-3 py-2 text-right"
                value={costoUnit}
                onChange={e => setCostoUnit(Number(e.target.value))}
                // Si querés bloquearlo: readOnly
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subtotal (auto)</label>
              <input className="w-full border rounded px-3 py-2 text-right" value={subtotal} readOnly />
            </div>
            <div>
              <label className="block text-sm mb-1">Descuento</label>
              <input
                type="number" min={0}
                className="w-full border rounded px-3 py-2 text-right"
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Anticipo</label>
              <input
                type="number" min={0}
                className="w-full border rounded px-3 py-2 text-right"
                value={anticipo}
                onChange={e => setAnticipo(e.target.value)}
              />
            </div>
          </div>

          {/* Saldo + observaciones + cobrado */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Saldo (auto)</label>
              <input className="w-full border rounded px-3 py-2 text-right" value={saldo} readOnly />
            </div>
            <div className="flex items-end gap-2">
              <input id="cobrado" type="checkbox" checked={cobrado} onChange={e => setCobrado(e.target.checked)} />
              <label htmlFor="cobrado">Marcar como cobrado</label>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Observaciones</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[84px]"
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2" onClick={onClose}>Cancelar</button>
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">
              {initial?.id ? "Guardar cambios" : "Crear pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
