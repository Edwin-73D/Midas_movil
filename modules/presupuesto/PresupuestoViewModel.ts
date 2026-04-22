import { useEffect, useState } from "react";
import { PresupuestoRepository } from "./PresupuestoRepository";

export const usePresupuestoViewModel = () => {
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = () => {
    const data = PresupuestoRepository.getCategorias();
    setCategorias(data);
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

  return { categorias, generarPresupuesto };
};