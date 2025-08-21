'use client';
import { addDoc, collection, onSnapshot, query, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { type CajaItem } from '@/types';

export default function ClientesPage() {
  const [items, setItems] = useState<CajaItem[]>([]);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'caja'));
    const unsub = onSnapshot(q, snap => {
 setItems(snap.docs.map(d => ({
 id: d.id,
 ...d.data() as DocumentData,
 }) as CajaItem));
    });
    return () => unsub();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'caja'), {
 concepto: nombre,
 monto: parseFloat(monto),
 createdAt: serverTimestamp(),
    });
    setNombre('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <form onSubmit={add} className="flex gap-2">
        <input className="p-2 rounded bg-neutral-800" placeholder="Concepto" value={nombre} onChange={e => setNombre(e.target.value)} />
 <input className="p-2 rounded bg-neutral-800" placeholder="Monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} />
        <button className="px-4 rounded bg-white text-black">Agregar</button>
      </form>
 <ul className="space-y-2 divide-y divide-neutral-700">
 {items.map(it => <li key={it.id} className="p-2 bg-neutral-900 rounded flex justify-between"><span>{it.concepto}</span><span>{it.monto}</span></li>)}
      </ul>
    </div>
  );
}