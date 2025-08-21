'use client';

import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { type MovimientoCaja } from '@/types'; // Import MovimientoCaja

export default function ClientesPage() {
  const [items, setItems] = useState<MovimientoCaja[]>([]); // Use MovimientoCaja

  useEffect(() => {
    const q = query(collection(db, 'clientes'), orderBy('nombre')); // Assuming 'clientes' collection and ordering by 'nombre'
    const unsub = onSnapshot(q, snap => {
      const clientesData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MovimientoCaja[]; // Cast to MovimientoCaja
      setItems(clientesData);
    });

    return () => unsub(); // Unsubscribe on cleanup
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      {/* Display your clients here using the 'items' state */}
      {/* This is a placeholder, replace with your actual client display logic */}
      <ul>
        {items.map(item => (
          <li key={item.id}>{/* Display client data, e.g., item.nombre */}</li>
        ))}
      </ul>
    </div>
  );
}