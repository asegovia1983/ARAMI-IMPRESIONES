'use client';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useMemo, useState } from 'react';

interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso';
  origen: string;
  monto: number;
  descripcion?: string;
  fecha: firebase.firestore.Timestamp | Date; // Use Timestamp or Date type
  metodoPago: string;
}

export default function CajaPage() {
  const [movs, setMovs] = useState<MovimientoCaja[]>([]);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [monto, setMonto] = useState(0);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'movimientosCaja'), orderBy('fecha','desc'));
    const unsub = onSnapshot(q, snap => setMovs(snap.docs.map(d=>({ id: d.id, ...d.data() }))));
    return () => unsub(); // Unsubscribe on cleanup
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'movimientosCaja'), {
      tipo, origen: tipo==='ingreso'?'ajuste':'ajuste', monto: Number(monto), descripcion: desc,
      fecha: serverTimestamp(), metodoPago: 'efectivo'
    });
    setMonto(0); setDesc('');
  };

  const total = useMemo(()=> movs.reduce((acc,m)=> acc + (m.tipo==='ingreso'?m.monto:-m.monto),0), [movs]);
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Caja</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-neutral-900 p-4 rounded-2xl">
        <select className="p-2 rounded bg-neutral-800" value={tipo} onChange={e=>setTipo(e.target.value as 'ingreso' | 'egreso')}>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <input className="p-2 rounded bg-neutral-800" type="number" placeholder="Monto" value={monto} onChange={e=>setMonto(Number(e.target.value))} />
        <input className="p-2 rounded bg-neutral-800" placeholder="Descripción" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button className="py-2 rounded bg-white text-black">Agregar</button>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="opacity-80">Movimientos</h2>
        <div className="text-lg">Saldo: <b>${total.toLocaleString('es-AR')}</b></div>
      </div>
      <ul className="space-y-2">
        {movs.map(m => (
          <li key={m.id} className="p-2 bg-neutral-900 rounded flex justify-between">
            <span className="opacity-70">{m.tipo.toUpperCase()} · {m.descripcion ?? '—'}</span>
            <span className={m.tipo==='ingreso' ? 'text-green-400' : 'text-red-400'}>
              {m.tipo==='ingreso' ? '+' : '-'}${m.monto?.toLocaleString('es-AR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}