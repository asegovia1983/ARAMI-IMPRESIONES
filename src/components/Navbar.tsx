// src/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePedidosFiltro } from "@/stores/usePedidosFiltro";
import { Menu } from 'lucide-react'; // Import the Menu icon

type Props = {
  toggleSidebar: () => void; // Add prop for toggling sidebar
  usuario?: { nombre: string; apellido?: string; empresa?: string };
};

export default function Navbar({ usuario, toggleSidebar }: Props) {
  const router = useRouter();
  const setQ = usePedidosFiltro(s => s.setQ);

  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-slate-200/20 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
      {/* Adjust left positioning for smaller screens */}
      <div className="flex h-14 items-center justify-between px-4 md:left-64">
        {/* Add button to toggle sidebar on small screens, hidden on md and larger */}
        {/* Show the toggle button on small screens and hide the "Pedidos" text */}
        <div className="flex items-center">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:block">
            Pedidos
          </div>
        <button
          className="md:hidden p-2 text-slate-600 dark:text-slate-300"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-3">
          {/* Adjust width for smaller screens */}
          <input
            placeholder="Buscar por cliente, estado…"
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-48 sm:w-72 rounded-lg border border-slate-300/40 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700/60 dark:bg-slate-900"
          />
          {/* UserMenu might need internal responsiveness or simplified view on small screens */}
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
      </div>
    </header>
  );
}
