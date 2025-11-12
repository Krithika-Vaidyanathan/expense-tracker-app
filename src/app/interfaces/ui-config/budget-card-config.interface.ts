// Used by the BudgetCard component
export interface BudgetCardConfig {
  id?: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
  onClick: () => any;
}