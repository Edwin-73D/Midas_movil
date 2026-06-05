export type FacturaItem = {
  nombre: string;
  monto: number;
};

export type FacturaAnalizada = {
  comercio: string;
  fecha: string | null;
  items: FacturaItem[];
  total: number;
};
