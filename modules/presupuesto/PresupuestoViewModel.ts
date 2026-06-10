import { useEffect, useState } from "react";
import { actualizarMontoReal, PresupuestoRepository } from "./PresupuestoRepository";
import { presupuestoEvents } from "./presupuestoEvents";

export const usePresupuestoViewModel = () => {
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    const data = await PresupuestoRepository.getCategorias();
    setCategorias(data);
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
  const generarPresupuestoDesdeMontos = (
    cats: { nombre: string; monto: number }[]
  ) => {
    PresupuestoRepository.limpiarCategorias();

    const totalMonto = cats.reduce((s, c) => s + c.monto, 0);

    cats.forEach((cat) => {
      const porcentaje =
        totalMonto > 0
          ? Math.round((cat.monto / totalMonto) * 1000) / 10
          : 0;

      PresupuestoRepository.insertarCategoria({
        nombre: cat.nombre,
        porcentaje,
        monto_esperado: cat.monto,
        monto_real: 0,
        descripcion: '',
      });
    });

    cargarCategorias();
    presupuestoEvents.emit();
  };

  return {
    categorias,
    generarPresupuestoDesdeMontos,
    agregarGasto,
    cargarCategorias,
  };
};
