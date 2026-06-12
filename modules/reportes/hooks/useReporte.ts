import { useEffect, useState } from 'react';

import { metaEvents } from '@/modules/metas/metaEvents';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';
import { getReporteCompleto } from '../data/report.service';
import type { Periodo, ReporteCompleto } from '../domain/report.model';

export function useReporte() {
  const [periodo, setPeriodo] = useState<Periodo>({ tipo: 'general' });
  const [data, setData] = useState<ReporteCompleto>(() => getReporteCompleto({ tipo: 'general' }));

  useEffect(() => {
    const cargar = () => setData(getReporteCompleto(periodo));
    cargar();
    const subs = [
      transactionEvents.subscribe(cargar),
      metaEvents.subscribe(cargar),
      presupuestoEvents.subscribe(cargar),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [periodo]);

  return { periodo, setPeriodo, data };
}
