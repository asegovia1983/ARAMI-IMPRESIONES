export type EstadoPedido = 'pendiente' | 'en_proceso' | 'terminado' | 'entregado';

export type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt?: any;
};

export type ItemPedido = {
  productoId: string;
  nombre: string;
  opciones?: Record<string, string>;
  cantidad: number;
  precioUnit: number;
  costoUnit?: number;
};

export type Pedido = {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  estado: EstadoPedido;
  items: ItemPedido[];
  subtotal: number;
  descuento: number;
  anticipo: number;
  total: number;
  saldo: number;
  observaciones?: string;
  fechaPrometida?: string; // YYYY-MM-DD
  createdAt?: any;
  updatedAt?: any;
  entregadoAt?: any;
  cobrado: boolean;
  metodoPago?: 'efectivo' | 'transferencia' | 'tarjeta' | null;
};

export type MovimientoCaja = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  origen: 'pedido' | 'insumo' | 'gasto_fijo' | 'ajuste';
  referenciaId?: string; // 'pedidos/ID' etc
  monto: number;
  descripcion?: string;
  metodoPago?: 'efectivo' | 'transferencia' | 'tarjeta';
  fecha?: any;
};