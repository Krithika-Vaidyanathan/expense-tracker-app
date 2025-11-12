export interface Expense {
  id: string;
  user_id: string;
  budget_id: string;
  name: string;
  amount: number;
  created_at: string | Date; // ✅ Supabase timestamp
}
