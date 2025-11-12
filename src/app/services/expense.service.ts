// src/app/services/expense.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Expense } from '../interfaces/models/expense.interface';
import { TableDataConfig } from '../interfaces/models/table-data-config.interface';
import { BudgetService } from './budget.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  [x: string]: any;
  private expenses$ = new BehaviorSubject<Expense[]>([]);

  constructor(private supabase: SupabaseService, private budgetService: BudgetService) {}

  /** 🔹 Load all expenses for current user */
  async loadExpensesForUser(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.expenses$.next(data || []);
    } catch (err) {
      console.error('Error loading expenses:', err);
      this.expenses$.next([]);
    }
  }

  /** 🔹 Create a new expense (with validation) */
  async createExpense(expense: Expense): Promise<void> {
    try {
      const budget = this.budgetService.getBudgetById(expense.budget_id);
      if (!budget) throw new Error('Selected budget not found.');

      const currentSpent = this.expenses$.value
        .filter((e) => e.budget_id === expense.budget_id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const newTotal = currentSpent + Number(expense.amount);

      if (newTotal > budget.budget) {
        throw new Error(`Expense exceeds the budget limit for "${budget.name}". Remaining: $${budget.budget - currentSpent}`);
      }

      // Insert into Supabase
      const { error } = await this.supabase.getClient().from('expenses').insert([expense]);
      if (error) throw error;

      // Update local BehaviorSubject optimistically
      const newExpenses = [expense, ...this.expenses$.value];
      this.expenses$.next(newExpenses);

      // Update the spent amount in budget
      await this.budgetService.updateBudgetSpent(expense.budget_id, newTotal);
    } catch (err) {
      console.error('Error creating expense:', err);
      throw err;
    }
  }

  async refreshExpensesAfterBudgetDelete(userId: string): Promise<void> {
  try {
    const { data, error } = await this.supabase
      .getClient()
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    this.expenses$.next(data || []);
  } catch (err) {
    console.error('Error refreshing expenses after budget delete:', err);
  }
}


 /** 🔹 Delete an expense — debug build: logs everything from Supabase */
async deleteExpenseById(expenseId: string): Promise<void> {
  try {
    const target = this.expenses$.value.find((e) => e.id === expenseId);
    if (!target) throw new Error('Expense not found locally');

    // 1) DELETE with detailed inspect
    const deleteResp = await this.supabase
      .getClient()
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .select(); // request returned rows if any

    // deleteResp can be { data, error, status, statusText } depending on client
    console.log('--- DELETE response raw ---', deleteResp);

    // If using older supabase-js versions, destructure:
    const { data: deletedData, error: deleteError } = deleteResp as any;
    if (deleteError) {
      console.error('Delete failed with error:', deleteError);
      throw deleteError;
    }
    console.log('Deleted rows (if any):', deletedData);

    // 2) Immediately run a SELECT and inspect response metadata
    const selectResp = await this.supabase
      .getClient()
      .from('expenses')
      .select('*');

    console.log('--- SELECT response raw ---', selectResp);
    const { data: latestExpenses, error: fetchError } = selectResp as any;
    if (fetchError) {
      console.error('Fetch after delete failed with error:', fetchError);
      throw fetchError;
    }

    console.log('✅ Latest expenses after delete (client):', latestExpenses);

    // 3) Update local BehaviorSubject only if fetch confirms deletion
    // (we keep this guarded so local state is consistent with server)
    const serverHasDeleted = !(latestExpenses || []).some((e: any) => e.id === expenseId);
    console.log('Server still has deleted id?', !serverHasDeleted);

    if (serverHasDeleted) {
      this.expenses$.next(latestExpenses || []);
      const newTotal = (latestExpenses || [])
        .filter((e: { budget_id: string; }) => e.budget_id === target.budget_id)
        .reduce((sum: number, e: { amount: any; }) => sum + Number(e.amount), 0);
      await this.budgetService.updateBudgetSpent(target.budget_id, newTotal);
    } else {
      console.warn('Deletion not reflected on server — NOT updating local state.');
    }
  } catch (err) {
    console.error('Error deleting expense (debug):', err);
    throw err;
  }
}



  /** 🔹 Build expense table view for UI */
  buildExpenseTable(expenses: Expense[]): TableDataConfig[] {
  return expenses.map((item) => {
    const budget = this.budgetService.getBudgetById(item.budget_id);

    return {
      id: item.id,
      name: item.name,
      amount: Number(item.amount),
      date: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      budget: budget?.name || item.budget_id,
      color: budget?.color || '#6b7280',
    } as TableDataConfig;
  });
}


  /** 🔹 Observable getter */
  getExpenseData(): Observable<Expense[]> {
    return this.expenses$.asObservable();
  }
}
