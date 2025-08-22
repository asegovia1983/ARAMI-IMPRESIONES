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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getFirebaseMsg = (fe: FirebaseError) => {
    // Ajustá/expandí estos casos según necesites
    switch (fe.code) {
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/missing-password':
        return 'Falta la contraseña.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Credenciales inválidas. Verificá email y contraseña.';
      case 'auth/user-disabled':
        return 'El usuario está deshabilitado.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Probá más tarde.';
      case 'auth/network-request-failed':
        return 'Error de red. Revisá tu conexión.';
      default:
        return fe.message || 'Ocurrió un error al iniciar sesión.';
    }
  };

  const login = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setErr(null);

    try {
      setLoading(true);
      const emailTrim = email.trim();
      const passTrim = pass;

      if (!emailTrim || !passTrim) {
        setErr('Ingresá tu email y contraseña.');
        return;
      }

      await signInWithEmailAndPassword(auth, emailTrim, passTrim);
      router.replace('/home/pedidos');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        setErr(getFirebaseMsg(error));
      } else {
        setErr(String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center min-h-screen p-4">
      <form onSubmit={login} className="w-full max-w-sm space-y-3 bg-neutral-900 p-6 rounded-2xl">
        <h1 className="text-xl font-semibold">Ingresar</h1>

        <input
          className="w-full p-2 rounded bg-neutral-800"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-neutral-800"
          placeholder="Contraseña"
          type="password"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <button
          className="w-full py-2 rounded bg-white text-black disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
