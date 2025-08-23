"use client";

import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, Timestamp, FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";

export interface MovimientoCaja {
  id?: string; // <— opcional
  tipo: "ingreso" | "egreso";
  origen: string;
  monto: number;
  descripcion?: string;
  fecha: Timestamp | Date;
  metodoPago: string;
}


/** Converter para tipar lecturas/escrituras y eliminar `any` en d.data() */
const movCajaConverter: FirestoreDataConverter<MovimientoCaja> = {
  toFirestore(m: Omit<MovimientoCaja, "id">) {
    return {
      tipo: m.tipo,
      origen: m.origen,
      monto: m.monto,
      descripcion: m.descripcion ?? "",
      fecha: m.fecha instanceof Date ? Timestamp.fromDate(m.fecha) : m.fecha,
      metodoPago: m.metodoPago,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot) {
    const d = snapshot.data() as {
      tipo: MovimientoCaja["tipo"];
      origen: string;
      monto: number;
      descripcion?: string;
      fecha: Timestamp | Date;
      metodoPago: string;
    };
    return {
      id: snapshot.id,
      tipo: d.tipo,
      origen: d.origen,
      monto: Number(d.monto || 0),
      descripcion: d.descripcion ?? "",
      fecha: d.fecha,
      metodoPago: d.metodoPago,
    };
  },
};

type TipoMovimiento = MovimientoCaja["tipo"];

export default function CajaPage() {
  const [movs, setMovs] = useState<MovimientoCaja[]>([]);
  const [tipo, setTipo] = useState<TipoMovimiento>("ingreso");
  const [monto, setMonto] = useState<number>(0);
  const [desc, setDesc] = useState<string>("");

  useEffect(() => {
    const col = collection(db, "movimientosCaja").withConverter(movCajaConverter);
    const q = query(col, orderBy("fecha","desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data());
      setMovs(list);
    });
    return () => unsub();
  }, []);

  const total = useMemo(() => {
    return movs.reduce(
      (acc, m) => {
        if (m.tipo === "ingreso") acc.ingresos += m.monto;
        else acc.egresos += m.monto;
        acc.neto = acc.ingresos - acc.egresos;
        return acc;
      },
      { ingresos: 0, egresos: 0, neto: 0 }
    );
  }, [movs]);

  const agregar = async () => {
    if (!monto || monto <= 0) return;
    const col = collection(db, "movimientosCaja").withConverter(movCajaConverter);
    await addDoc(col, {
      id: "", // Firestore lo asigna; no se usa en toFirestore
      tipo,
      origen: "Caja",
      monto,
      descripcion: desc.trim(),
      fecha: serverTimestamp() as unknown as Timestamp, // se normaliza luego por converter/lectura
      metodoPago: "efectivo",
    });
    setMonto(0);
    setDesc("");
  };

  const formatAR = (n: number) => `AR$ ${n.toLocaleString("es-AR")}`;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Caja</h1>

      <div className="flex gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm">Tipo</label>
          <select
            className="border rounded px-2 py-1"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm">Monto</label>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="text-sm">Descripción</label>
          <input
            className="border rounded px-2 py-1"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Detalle..."
          />
        </div>
        <button
          onClick={agregar}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
        >
          Agregar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded border bg-green-50">
          <div className="text-xs text-gray-600">Ingresos</div>
          <div className="text-lg font-semibold">{formatAR(total.ingresos)}</div>
        </div>
        <div className="p-3 rounded border bg-red-50">
          <div className="text-xs text-gray-600">Egresos</div>
          <div className="text-lg font-semibold">{formatAR(total.egresos)}</div>
        </div>
        <div className="p-3 rounded border bg-gray-50">
          <div className="text-xs text-gray-600">Neto</div>
          <div className="text-lg font-semibold">{formatAR(total.neto)}</div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Fecha</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Descripción</th>
              <th className="p-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movs.map((m) => {
              const d =
                m.fecha instanceof Timestamp
                  ? m.fecha.toDate()
                  : m.fecha instanceof Date
                  ? m.fecha
                  : null;
              return (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{d ? d.toLocaleString("es-AR") : "—"}</td>
                  <td className="p-2 capitalize">{m.tipo}</td>
                  <td className="p-2">{m.descripcion || "—"}</td>
                  <td className="p-2 text-right">
                    {formatAR(Number(m.monto || 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
