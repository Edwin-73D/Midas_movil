// HU-16: 'Savings' ya no es una categoría de gasto; el ahorro es un tipo propio.
export type ExpenseCategory = 'Needs' | 'Wants';

export const DB_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  Needs: 'Needs',
  Wants: 'Wants',
};
