// app/home/layout.tsx  (o tu layout de esa ruta)
'use client';

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useState } from "react"; // Import useState

export default function Layout({ children }: { children: React.ReactNode }) {
  const usuario = { nombre: "Dora", apellido: "G.", empresa: "Impresiones Arami" };
  // State to control sidebar visibility on small screens
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Pass isSidebarOpen state to Sidebar for conditional rendering on small screens */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Navbar usuario={usuario} toggleSidebar={toggleSidebar} /> {/* Pass toggleSidebar to Navbar */}
      <main className={`pt-16 px-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64 md:ml-64' : 'ml-0 md:ml-64'}`}>{children}</main> {/* Adjust margin based on sidebar state and screen size */}
    </div>
  );
}
