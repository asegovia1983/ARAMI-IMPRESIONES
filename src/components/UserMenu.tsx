// components/UserMenu.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User, Building2 } from "lucide-react";

type Props = {
  nombre: string;
  apellido?: string;
  empresa?: string;
  onPerfil?: () => void;
  onSalir?: () => void;
};

function getIniciales(nombre = "", apellido = "") {
  const n = (nombre?.trim()?.[0] || "").toUpperCase();
  const a = (apellido?.trim()?.[0] || "").toUpperCase();
  return (n + a) || "U";
}

export default function UserMenu({
  nombre,
  apellido = "",
  empresa = "",
  onPerfil,
  onSalir,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const iniciales = getIniciales(nombre, apellido);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-300/20 bg-white/5 px-2 py-1 text-left backdrop-blur hover:bg-white/10"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {iniciales}
        </div>
        <ChevronDown className="h-4 w-4 text-slate-300" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200/20 bg-slate-900 text-slate-100 shadow-xl">
          <div className="px-4 py-3">
            <div className="text-sm font-semibold">{nombre} {apellido}</div>
            {empresa ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                <Building2 className="h-3.5 w-3.5" />
                <span>{empresa}</span>
              </div>
            ) : null}
          </div>
          <div className="h-px bg-slate-700/50" />
          <button
            onClick={onPerfil}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-800"
          >
            <User className="h-4 w-4" />
            Perfil
          </button>
          <button
            onClick={onSalir}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
