'use client';

import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { type Cliente } from '@/types'; // Import Cliente

export default function ClientesPage() {
  const [items, setItems] = useState<MovimientoCaja[]>([]); // Use MovimientoCaja

  useEffect(() => {
    const q = query(collection(db, 'clientes'), orderBy('nombre')); // Assuming 'clientes' collection and ordering by 'nombre'
    const unsub = onSnapshot(q, snap => {
      const clientesData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cliente[]; // Cast to Cliente type based on the data
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
          // Basic display for demonstration. You'll want to style this better.
          // Consider using a grid or flexbox for better layout on different screen sizes.
          <li key={item.id} className="border-b border-gray-200 py-2">
            {/* Assuming Cliente type has a 'nombre' property */}
            {item.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}