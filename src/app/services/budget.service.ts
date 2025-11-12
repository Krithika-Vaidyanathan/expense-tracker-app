// src/app/services/budget.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Budget } from '../interfaces/models/budget.interface';
import { BudgetCategory } from '../interfaces/models/budget-category.interface';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private budgets$ = new BehaviorSubject<Budget[]>([]);
  private categories$ = new BehaviorSubject<BudgetCategory[]>([]);

  constructor(private supabase: SupabaseService) {}

  /** 🔹 Load all budgets for the logged-in user */
  async loadBudgetsForUser(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.budgets$.next(data || []);
      this.syncBudgetCategories(data || []);
    } catch (err) {
      console.error('Error loading budgets:', err);
      this.budgets$.next([]);
    }
  }

  /** 🔹 Create a new budget in Supabase */
  async createBudget(budget: Budget): Promise<void> {
    try {
      const { error } = await this.supabase.getClient().from('budgets').insert([budget]);
      if (error) throw error;

      // Refresh list after insertion
      await this.loadBudgetsForUser(budget.user_id);
    } catch (err) {
      console.error('Error creating budget:', err);
      throw err;
    }
  }

  /** 🔹 Delete budget (and cascade delete its expenses) */
  async deleteBudgetById(budgetId: string): Promise<void> {
    try {
      // 1️⃣ Perform delete and confirm the row removed
      const deleteResp = await this.supabase
        .getClient()
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .select();

      const { error: deleteError } = deleteResp as any;
      if (deleteError) throw deleteError;

      console.log('✅ Budget deleted (cascade handled by DB):', deleteResp);

      // 2️⃣ Update local budgets (optimistic UI)
      const remainingBudgets = this.budgets$.value.filter((b) => b.id !== budgetId);
      this.budgets$.next(remainingBudgets);
      this.syncBudgetCategories(remainingBudgets);

      // ✅ Cascade deletion handled by Supabase automatically.
      // We no longer attempt to touch expenses$ here because that belongs to ExpenseService.
    } catch (err) {
      console.error('Error deleting budget (cascade):', err);
      throw err;
    }
  }


  /** 🔹 Update spent value for a specific budget */
  async updateBudgetSpent(budgetId: string, spent: number): Promise<void> {
    try {
      const { error } = await this.supabase.getClient().from('budgets').update({ spent }).eq('id', budgetId);
      if (error) throw error;

      // Update local BehaviorSubject (no full reload needed)
      const updated = this.budgets$.value.map((b) => (b.id === budgetId ? { ...b, spent } : b));
      this.budgets$.next(updated);
    } catch (err) {
      console.error('Error updating budget spent:', err);
    }
  }

  /** 🔹 Private helper — derive BudgetCategories from Budgets */
  private syncBudgetCategories(budgets: Budget[]): void {
    const categories: BudgetCategory[] = budgets.map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
    }));
    this.categories$.next(categories);
  }

  /** 🔹 Observable getters */
  getBudgetData(): Observable<Budget[]> {
    return this.budgets$.asObservable();
  }

  getBudgetCategoryData(): Observable<BudgetCategory[]> {
    return this.categories$.asObservable();
  }

  /** 🔹 Utility: Get budget by ID */
  getBudgetById(budgetId: string): Budget | undefined {
    return this.budgets$.value.find((b) => b.id === budgetId);
  }
}
