"use client";
import { useState } from "react";
import { getReporteMensual } from "@/lib/reportes";

export default function ReportesPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [reporte, setReporte] = useState<any>(null);

  async function cargar() {
    const data = await getReporteMensual(anio, mes);
    setReporte(data);
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <h1 className="text-lg font-bold mb-4">Reporte de Rentabilidad</h1>
      <div className="flex gap-2 mb-4">
        <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} />
        <input type="number" value={mes} onChange={e => setMes(Number(e.target.value))} />
        <button onClick={cargar} className="bg-blue-500 text-white px-3 py-1 rounded">Generar</button>
      </div>

      {reporte && (
        <>
          <div className="mb-4">
            <p>Ingresos: ${reporte.ingresos.toLocaleString("es-AR")}</p>
            <p>Costos: ${reporte.costos.toLocaleString("es-AR")}</p>
            <p>Ganancia: ${reporte.ganancia.toLocaleString("es-AR")}</p>
            <p>Margen: {reporte.margen.toFixed(2)}%</p>
          </div>

          <h2 className="font-bold">Detalle por producto</h2>
          <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-gray-50">
              <tr >
                <th className="p-2 border">Producto</th>
                <th className="p-2 border">Cantidad</th>
                <th className="p-2 border">Ingreso</th>
                <th className="p-2 border">Costo</th>
                <th className="p-2 border">Ganancia</th>
                <th className="p-2 border">Margen</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200" >
              {reporte.detalleProductos.map((p: any) => (
                <tr key={p.nombre}>
                  <td className="border p-1">{p.nombre}</td>
                  <td className="border p-1">{p.cant}</td>
                  <td className="border p-1">${p.ingreso.toLocaleString("es-AR")}</td>
                  <td className="border p-1">${p.costo.toLocaleString("es-AR")}</td>
                  <td className="border p-1">${p.ganancia.toLocaleString("es-AR")}</td>
                  <td className="border p-1">{p.margen.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
