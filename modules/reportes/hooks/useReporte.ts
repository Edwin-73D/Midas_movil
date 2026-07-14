import { useEffect, useState } from 'react';

import { metaEvents } from '@/modules/metas/metaEvents';
import { presupuestoEvents } from '@/modules/presupuesto/presupuestoEvents';
import { transactionEvents } from '@/modules/transacciones/transactionEvents';
import { obtenerConsejo } from '../data/generar-consejo.service';
import { getReporteCompleto } from '../data/report.service';
import type { Periodo, ReporteCompleto } from '../domain/report.model';

export type ConsejoState = {
  texto: string | null;
  cargando: boolean;
  mes: { anio: number; mes: number } | null;
  hayDatos: boolean;
};

export function useReporte() {
  const [periodo, setPeriodo] = useState<Periodo>({ tipo: 'general' });
  const [data, setData] = useState<ReporteCompleto>(() => getReporteCompleto({ tipo: 'general' }));
  const [consejo, setConsejo] = useState<ConsejoState>({
    texto: null,
    cargando: true,
    mes: null,
    hayDatos: false,
  });

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

  // HU-07: consejo IA (cacheado por mes); se recalcula al cambiar período o datos.
  useEffect(() => {
    let cancelado = false;
    setConsejo((c) => ({ ...c, cargando: true }));
    obtenerConsejo(periodo, data)
      .then((res) => {
        if (cancelado) return;
        setConsejo({ texto: res.texto, cargando: false, mes: res.mes, hayDatos: res.hayDatos });
      })
      .catch(() => {
        if (cancelado) return;
        setConsejo({ texto: null, cargando: false, mes: null, hayDatos: false });
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, data]);

  return { periodo, setPeriodo, data, consejo };
}
