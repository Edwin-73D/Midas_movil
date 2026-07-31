import { useEffect, useState } from "react";
import {
  getFrecuenciaPresupuesto,
  setFrecuenciaPresupuesto,
} from "@/modules/presupuesto/data/presupuesto-config";
import type { FrecuenciaPresupuesto } from "@/modules/presupuesto/periodo";
import { actualizarMontoReal, CLAVE_AHORROS, PresupuestoRepository } from "./PresupuestoRepository";
import { presupuestoEvents } from "./presupuestoEvents";

type CategoriaInput = { nombre: string; monto: number; clave?: string | null };

export const usePresupuestoViewModel = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPresupuesto>(() => getFrecuenciaPresupuesto());

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    const data = await PresupuestoRepository.getCategorias();
    setCategorias(data);
  };

  /** HU: cambia la frecuencia del presupuesto (mensual/quincenal) y recarga
   *  las categorías, que se recalculan automáticamente sobre el nuevo rango. */
  const actualizarFrecuencia = async (nueva: FrecuenciaPresupuesto) => {
    setFrecuenciaPresupuesto(nueva);
    setFrecuencia(nueva);
    await cargarCategorias();
    presupuestoEvents.emit();
  };

  const agregarGasto = async (categoriaId: number, monto: number) => {
    await actualizarMontoReal(categoriaId, monto);
    await cargarCategorias();
    presupuestoEvents.emit();
  };

  /**
   * Genera el presupuesto a partir de montos directos por categoría.
   * Reemplaza el contenido actual de la tabla Categoria.
   * El porcentaje se calcula automáticamente sobre el total.
   */
  const generarPresupuestoDesdeMontos = async (cats: CategoriaInput[]) => {
    // limpiarCategorias preserva la categoría fija de ahorros (HU-01).
    PresupuestoRepository.limpiarCategorias();
    PresupuestoRepository.ensureCategoriaAhorros();

    const totalMonto = cats.reduce((s, c) => s + c.monto, 0);

    cats.forEach((cat) => {
      const porcentaje =
        totalMonto > 0
          ? Math.round((cat.monto / totalMonto) * 1000) / 10
          : 0;

      if (cat.clave === CLAVE_AHORROS) {
        // La categoría fija ya existe: solo se actualiza su presupuesto,
        // conservando su monto_real acumulado por los ahorros.
        PresupuestoRepository.actualizarPresupuestoAhorros(cat.monto, porcentaje);
      } else {
        PresupuestoRepository.insertarCategoria({
          nombre: cat.nombre,
          porcentaje,
          monto_esperado: cat.monto,
          monto_real: 0,
          descripcion: '',
        });
      }
    });

    await cargarCategorias();
    presupuestoEvents.emit();
  };

  return {
    categorias,
    generarPresupuestoDesdeMontos,
    agregarGasto,
    cargarCategorias,
    frecuencia,
    actualizarFrecuencia,
  };
};
