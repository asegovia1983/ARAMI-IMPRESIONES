'use client';

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

// El estado de la app usará siempre Date para simplificar render
interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso';
  origen: string;
  monto: number;
  descripcion?: string;
  fecha: Date;            // <- solo Date en el estado
  metodoPago: string;
}

// Helper robusto para normalizar cualquier input de fecha a Date
const toDate = (v: unknown): Date => {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;

  // Objeto plano con { seconds, nanoseconds }
  if (v && typeof v === 'object' && 'seconds' in (v as any)) {
    const s = Number((v as any).seconds) || 0;
    const ns = Number((v as any).nanoseconds) || 0;
    return new Date(s * 1000 + Math.floor(ns / 1e6));
  }

  if (typeof v === 'number') return new Date(v); // epoch ms
  if (typeof v === 'string') return new Date(v); // ISO u otro parseable

  return new Date(NaN); // inválido: si querés, validalo aguas arriba
};

export default function CajaPage() {
  const [movs, setMovs] = useState<MovimientoCaja[]>([]);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [monto, setMonto] = useState<number>(0);
  const [desc, setDesc] = useState<string>('');

  useEffect(() => {
    const q = query(collection(db, 'movimientosCaja'), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: MovimientoCaja[] = snap.docs.map((d) => {
        const data = d.data() as any; // datos crudos del doc
        return {
          id: d.id,
          tipo: data?.tipo ?? 'ingreso',
          origen: data?.origen ?? 'ajuste',
          monto: Number(data?.monto ?? 0),
          descripcion: data?.descripcion ?? '',
          fecha: toDate(data?.fecha), // <- normalizamos SIEMPRE a Date
          metodoPago: data?.metodoPago ?? 'efectivo',
        };
      });
      setMovs(items);
    });
    return () => unsub();
  }, []);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validación mínima
    const montoNum = Number(monto);
    if (!montoNum || Number.isNaN(montoNum)) return;

    await addDoc(collection(db, 'movimientosCaja'), {
      tipo,
      origen: 'ajuste',
      monto: montoNum,
      descripcion: desc || null,
      fecha: serverTimestamp(), // guardamos Timestamp en Firestore
      metodoPago: 'efectivo',
    });

    setMonto(0);
    setDesc('');
  };

  const total = useMemo(
    () => movs.reduce((acc, m) => acc + (m.tipo === 'ingreso' ? m.monto : -m.monto), 0),
    [movs]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Caja</h1>

      {/* Form responsive */}
      <form
        onSubmit={add}
        className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-neutral-900 p-4 rounded-2xl"
      >
        <select
          className="p-2 rounded bg-neutral-800 text-white"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'ingreso' | 'egreso')}
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>

        <input
          className="p-2 rounded bg-neutral-800"
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMonto(Number(e.target.value))}
        />

        <input
          className="p-2 rounded bg-neutral-800"
          placeholder="Descripción"
          value={desc}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)}
        />

        <button className="py-2 rounded bg-white text-black">Agregar</button>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="opacity-80">Movimientos</h2>
        <div className="text-lg">
          Saldo: <b>${total.toLocaleString('es-AR')}</b>
        </div>
      </div>

      {/* Lista */}
      <ul className="space-y-2">
        {movs.map((m) => (
          <li key={m.id} className="p-2 bg-neutral-900 rounded flex justify-between">
            <span className="opacity-70">
              {m.tipo.toUpperCase()} · {m.descripcion || '—'}
            </span>
            <span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>
              {m.tipo === 'ingreso' ? '+' : '-'}${m.monto?.toLocaleString('es-AR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}