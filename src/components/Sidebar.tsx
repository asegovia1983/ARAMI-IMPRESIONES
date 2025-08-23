"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingCart, Calculator, LineChart, LogOut } from "lucide-react"; 

interface SidebarProps {
  isOpen: boolean; // This prop seems unused in the component logic.
  toggleSidebar: () => void; // This prop seems unused in the component logic.
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  const item = (href: string, label: string, Icon: React.ElementType) => {
    const active = pathname?.startsWith(href);
    return ( 
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition
        ${active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur transform transition-transform duration-300 ease-in-out md:translate-x-0 md:block">
      <div className="px-4 py-4">
        <div className="text-lg font-semibold tracking-wide text-white">Impresiones Arami</div>
      </div> 
      <nav className="mt-2 space-y-1 px-3">
        {item("/home/pedidos", "Pedidos", ShoppingCart)}
        {item("/home/productos", "Productos", Package)}
        {item("/home/componentes-costo", "Componente Costo", Calculator)}
        {item("/home/reportes", "Reportes", LineChart)}
        {/*item("/salir", "Salir", LogOut)*/}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-slate-800 p-3 text-xs text-slate-400">
        <div className="font-medium text-slate-200">Versión 1.0</div>
        <div>© {new Date().getFullYear()} Arami</div>
      </div>
    </aside>
  );

}
