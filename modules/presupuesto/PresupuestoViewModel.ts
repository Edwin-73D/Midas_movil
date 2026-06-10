import { useEffect, useState } from "react";
import { actualizarMontoReal, PresupuestoRepository } from "./PresupuestoRepository";

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
    console.log("🔥 ENTRANDO A agregarGasto");

    await actualizarMontoReal(categoriaId, monto);

    console.log("🔥 DESPUÉS DE actualizarMontoReal");

    await cargarCategorias();
  };

  const generarPresupuesto = (ingreso: number, metodo: string) => {
    let distribucion;

    if (metodo === "50-30-20") {
      distribucion = [50, 30, 20];
    } else if (metodo === "60-20-20") {
      distribucion = [60, 20, 20];
    }

    if (!distribucion) return;

    // limpiar antes de insertar
    PresupuestoRepository.limpiarCategorias();

    const categorias = [
      { nombre: "Needs", porcentaje: distribucion[0] },
      { nombre: "Wants", porcentaje: distribucion[1] },
      { nombre: "Savings & Debt", porcentaje: distribucion[2] },
    ];

    categorias.forEach((cat) => {
      const monto = (ingreso * cat.porcentaje) / 100;

      PresupuestoRepository.insertarCategoria({
        nombre: cat.nombre,
        porcentaje: cat.porcentaje,
        monto_esperado: monto,
        monto_real: 0,
        descripcion: "",
      });
    });

    // 🔄 recargar datos
    cargarCategorias();
  };

  /**
   * Genera un presupuesto con categorías completamente personalizadas.
   * Reemplaza el contenido actual de la tabla Categoria.
   * No toca la lógica de los métodos predefinidos 50-30-20 / 60-20-20.
   */
  const generarPresupuestoPersonalizado = (
    ingreso: number,
    cats: { nombre: string; porcentaje: number }[]
  ) => {
    PresupuestoRepository.limpiarCategorias();

    cats.forEach((cat) => {
      PresupuestoRepository.insertarCategoria({
        nombre: cat.nombre,
        porcentaje: cat.porcentaje,
        monto_esperado: (ingreso * cat.porcentaje) / 100,
        monto_real: 0,
        descripcion: '',
      });
    });

    cargarCategorias();
  };

  return {
    categorias,
    generarPresupuesto,
    generarPresupuestoPersonalizado,
    agregarGasto,
    cargarCategorias,
  };
};