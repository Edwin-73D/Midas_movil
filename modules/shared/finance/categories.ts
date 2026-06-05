export type ExpenseCategory = 'Needs' | 'Wants' | 'Savings';

export const DB_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  Needs: 'Needs',
  Wants: 'Wants',
  Savings: 'Savings & Debt',
};
