"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  WithFieldValue,
  SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==== Tipo del documento ====
export interface Cliente {
  id?: string;                 // id del doc (no se guarda en Firestore)
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
  createdAt?: Timestamp | Date;
}

// ==== Converter tipado (sin any) ====
const clienteConverter: FirestoreDataConverter<Cliente> = {
  toFirestore(model: WithFieldValue<Cliente>): DocumentData {
    // Construimos el objeto a guardar SIN el campo `id`
    const m = model as Cliente;
    const out: DocumentData = {
      nombre: m.nombre,
      telefono: m.telefono,
      email: m.email,
      direccion: m.direccion,
      activo: m.activo,
      createdAt: m.createdAt,
    };
    return out;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Cliente {
    const d = snapshot.data(options) as Omit<Cliente, "id">;
    return { id: snapshot.id, ...d };
  },
};

function isTimestamp(x: unknown): x is Timestamp {
  return (
    !!x &&
    typeof x === "object" &&
    "toDate" in (x as Record<string, unknown>) &&
    typeof (x as { toDate?: unknown }).toDate === "function"
  );
}

export default function ClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const col = collection(db, "clientes").withConverter(clienteConverter);
    const qy = query(col, orderBy("nombre"));
    const unsub = onSnapshot(qy, (snap) => {
      setItems(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      [
        c.nombre ?? "",
        c.telefono ?? "",
        c.email ?? "",
        c.direccion ?? "",
        String(c.activo ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q, items]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <input
          className="border rounded px-3 py-2"
          placeholder="Buscar por nombre, teléfono, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Email</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Activo</th>
              <th className="p-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((c) => {
                const d =
                  isTimestamp(c.createdAt)
                    ? c.createdAt.toDate()
                    : c.createdAt instanceof Date
                    ? c.createdAt
                    : null;
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.telefono || "—"}</td>
                    <td className="p-3">{c.email || "—"}</td>
                    <td className="p-3">{c.direccion || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-2 ${
                          c.activo ? "text-green-700" : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            c.activo ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {c.activo ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="p-3">
                      {d ? d.toLocaleDateString("es-AR") : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="p-3" colSpan={6}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
