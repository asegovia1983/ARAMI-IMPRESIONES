'use client';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      router.replace(u ? '/home/pedidos' : '/login');
    });
    return () => unsub();
  }, [router]);
  return null;
}