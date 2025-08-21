// src/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePedidosFiltro } from "../stores/usePedidosFiltro";

type Props = {
  usuario?: { nombre: string; apellido?: string; empresa?: string };
};

export default function Navbar({ usuario }: Props) {
  const router = useRouter();
  const setQ = usePedidosFiltro(s => s.setQ);

  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-slate-200/20 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Pedidos
        </div>
        <div className="flex items-center gap-3">
          <input
            placeholder="Buscar por cliente, estado…"
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-72 rounded-lg border border-slate-300/40 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700/60 dark:bg-slate-900"
          />
          <UserMenu
            nombre={usuario?.nombre || "Usuario"}
            apellido={usuario?.apellido}
            empresa={usuario?.empresa}
            onPerfil={() => router.push("/home/perfil")}
            onSalir={async () => {
              await signOut(auth);
              router.push("/login");
            }}
          />
        </div>
      </div>
    </header>
  );
}
