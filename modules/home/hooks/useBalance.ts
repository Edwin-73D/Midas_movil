import { useEffect, useState } from 'react';

import sqlite from '@/db/client';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';

function calcBalance(): number {
  try {
    // HU-16: el balance disponible = ingresos − gastos − ahorros.
    // El ahorro resta del disponible (el dinero se aparta) pero no es un gasto.
    const result = sqlite.getFirstSync(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'income' THEN valor_transaccion ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN tipo IN ('expense', 'saving') THEN valor_transaccion ELSE 0 END), 0)
        AS balance
      FROM transaccion`
    ) as { balance: number } | null;
    return result?.balance ?? 0;
  } catch {
    return 0;
  }
}

export function useBalance() {
  const [balance, setBalance] = useState(calcBalance);

  useEffect(() => {
    setBalance(calcBalance());
    return transactionEvents.subscribe(() => setBalance(calcBalance()));
  }, []);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(balance);

  return { balance, formatted };
}
