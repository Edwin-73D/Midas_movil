import sqlite from '@/db/client';
import { addMontoToProductoInternal } from '@/modules/productos/data/producto.service';
import { TransaccionRepository } from '@/modules/transacciones/TransaccionRepository';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

type Opts = {
  onPresupuestoGasto?: (categoriaId: number, monto: number) => Promise<void> | void;
};

export function eliminarTransaccion(id: number, opts: Opts = {}): void {
  const tx = TransaccionRepository.getById(id);
  if (!tx) return;

  try {
    if (tx.tipo === 'expense' && tx.categoria_id != null) {
      opts.onPresupuestoGasto?.(tx.categoria_id, -tx.valor_transaccion);
    } else if (tx.tipo === 'saving' && tx.producto_financiero_id != null) {
      addMontoToProductoInternal(tx.producto_financiero_id, -tx.valor_transaccion);
    }

    if (tx.meta_id != null) {
      sqlite.runSync('DELETE FROM meta_aporte WHERE transaccion_id = ?', [id]);
    }

    sqlite.runSync('DELETE FROM transaccion WHERE ID = ?', [id]);
    transactionEvents.emit();
  } catch (e) {
    console.log('Error eliminarTransaccion:', e);
  }
}
