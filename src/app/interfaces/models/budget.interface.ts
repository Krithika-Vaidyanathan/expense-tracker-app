// Budget as stored in Supabase `budgets` table
export interface Budget {
  id: string;
  user_id: string;
  name: string;
  budget: number; // total budget amount
  spent: number;  // total spent (computed)
  color: string;
  created_at?: string;
}