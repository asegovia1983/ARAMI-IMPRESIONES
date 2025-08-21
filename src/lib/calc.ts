import { ItemPedido } from '@/types';

export function calcularSubtotal(items: ItemPedido[]) {
  return items.reduce((acc, it) => acc + it.precioUnit * it.cantidad, 0);
}

export function calcularSaldo(total: number, anticipo: number) {
  return Math.max(total - (anticipo || 0), 0);
}