// app/home/layout.tsx  (o tu layout de esa ruta)
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const usuario = { nombre: "Dora", apellido: "G.", empresa: "Impresiones Arami" };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <Navbar usuario={usuario} /> {/* <- sin onPerfil/onSalir/onBuscar */}
      <main className="ml-64 pt-16 px-6">{children}</main>
    </div>
  );
}
