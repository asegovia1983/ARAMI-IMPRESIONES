import { Pedido } from '@/types';

export default function PedidoCard({ p, onMove, onCobrar }: { p: Pedido; onMove: (nuevoEstado: Pedido['estado']) => void; onCobrar: () => void; }) {
  return (
    <div className="rounded-xl p-3 bg-neutral-900 border border-neutral-800 space-y-2">
      <div className="text-sm opacity-80">{p.clienteNombre ?? '—'}</div>
      <div className="font-semibold">${p.total.toLocaleString('es-AR')}</div>
      <div className="text-xs opacity-60">Saldo: ${p.saldo.toLocaleString('es-AR')}</div>
      <div className="flex gap-2 text-xs">
        {p.estado !== 'pendiente' && <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => onMove('pendiente')}>← Pendiente</button>}
        {p.estado !== 'en_proceso' && <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => onMove('en_proceso')}>En proceso</button>}
        {p.estado !== 'terminado' && <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => onMove('terminado')}>Terminado</button>}
        {p.estado !== 'entregado' && <button className="px-2 py-1 bg-neutral-800 rounded" onClick={() => onMove('entregado')}>Entregado</button>}
      </div>
      {p.estado === 'entregado' && !p.cobrado && (
        <button className="w-full py-1 bg-white text-black rounded" onClick={onCobrar}>Marcar cobrado</button>
      )}
    </div>
  );
}