// For displaying expense data in the Table component
export interface TableDataConfig {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO date string for compatibility with backend
  budget: string; // Budget name
  color: string;
}