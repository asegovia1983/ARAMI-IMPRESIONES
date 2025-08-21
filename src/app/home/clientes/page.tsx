'use client';
import { addDoc, collection, onSnapshot, query, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { type CajaItem } from '@/types';
import { type MovimientoCaja, type Cliente } from '@/types';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'clientes'));
    const unsub = onSnapshot(q, snap => {
 setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MovimientoCaja)));
    });
    return () => unsub();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'caja'), {
 nombre: nombre,
 // Assuming there's a field for client-specific data like 'activo' in Cliente
 createdAt: serverTimestamp(),
    });
    setNombre('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Clientes</h1> {/* Use the state variable name consistent with the data it holds */}
      <form onSubmit={add} className="flex gap-2">
        <input className="p-2 rounded bg-neutral-800" placeholder="Nombre del cliente" value={nombre} onChange={e => setNombre(e.target.value)} />
 {/* Add input for other client fields if necessary, e.g., phone, email */}
        <button className="px-4 rounded bg-white text-black">Agregar</button>
      </form>
 <ul className="space-y-2 divide-y divide-neutral-700">
 {items.map(cliente => <li key={cliente.id} className="p-2 bg-neutral-900 rounded flex justify-between"><span>{cliente.nombre}</span>{/* Display other client info here */}</li>)}
      </ul>
    </div>
  );
}