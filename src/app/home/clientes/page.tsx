'use client';
import { addDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';

export default function ClientesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'clientes'));
    const unsub = onSnapshot(q, snap => setItems(snap.docs.map(d=>({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'clientes'), { nombre, activo: true, createdAt: serverTimestamp() });
    setNombre('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <form onSubmit={add} className="flex gap-2">
        <input className="p-2 rounded bg-neutral-800" placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} />
        <button className="px-4 rounded bg-white text-black">Agregar</button>
      </form>
      <ul className="space-y-2">
        {items.map(it => <li key={it.id} className="p-2 bg-neutral-900 rounded">{it.nombre}</li>)}
      </ul>
    </div>
  );
}