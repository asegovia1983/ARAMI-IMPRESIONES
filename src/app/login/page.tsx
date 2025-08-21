'use client';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.replace('/home/pedidos');
    } catch (e) {
 if (e instanceof FirebaseError) {
 setErr(e.message);
 }
       
      setErr(e.message);
    }
  };

  return (
    <div className="grid place-items-center min-h-screen p-4">
      <form onSubmit={login} className="w-full max-w-sm space-y-3 bg-neutral-900 p-6 rounded-2xl">
        <h1 className="text-xl font-semibold">Ingresar</h1>
        <input className="w-full p-2 rounded bg-neutral-800" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-2 rounded bg-neutral-800" placeholder="Contraseña" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="w-full py-2 rounded bg-white text-black">Entrar</button>
      </form>
    </div>
  );
}