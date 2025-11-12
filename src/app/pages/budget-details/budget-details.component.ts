import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { combineLatest, Subject, take, takeUntil } from 'rxjs';

import { TableDataConfig } from '../../interfaces/models/table-data-config.interface';
import { Expense } from '../../interfaces/models/expense.interface';
import { BudgetCardConfig } from '../../interfaces/ui-config/budget-card-config.interface';
import { BudgetService } from '../../services/budget.service';
import { ExpenseService } from '../../services/expense.service';
import { UiService } from '../../services/ui.service';
import { UserService } from '../../services/user.service';

import { PopupComponent } from '../../components/popup/popup.component';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { FormWrapperComponent } from '../../components/form-wrapper/form-wrapper.component';
import { TableComponent } from '../../components/table/table.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-budget-details',
  standalone: true,
  imports: [CommonModule, PopupComponent, ReactiveFormsModule, BudgetCardComponent, FormWrapperComponent, TableComponent],
  templateUrl: './budget-details.component.html',
  styleUrl: './budget-details.component.scss',
})
export class BudgetDetailsComponent implements OnInit {
  budgetCard!: BudgetCardConfig;
  expenseTableData: TableDataConfig[] = [];
  budgetId: string = '';

  showPopup = false;
  popupMessage = '';

  private destroy$ = new Subject<void>(); // 👈 for cleanup like in Home

  expenseForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor(
    private router: Router,
    private budgetService: BudgetService,
    private expenseService: ExpenseService,
    public uiService: UiService,
    private activatedRoute: ActivatedRoute,
    private userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    // Extract budgetId from route
    this.activatedRoute.params.pipe(take(1)).subscribe(async (params: Params) => {
      this.budgetId = params['id'];
      await this.initializeData();
    });

    /** ✅ Combine budgets + expenses like in Home */
    combineLatest([
      this.budgetService.getBudgetData(),
      this.expenseService.getExpenseData(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([budgets, expenses]) => {
        this.syncBudgetWithExpenses(budgets || [], expenses || []);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** 🔹 Initialize data for the selected budget */
  private async initializeData(): Promise<void> {
    const budget = this.budgetService.getBudgetById(this.budgetId);
    if (!budget) {
      this.showMessage('Budget not found.');
      return;
    }

    // Build expense table initially
    const expenses = this.expenseService.getExpenseData().pipe(take(1)).subscribe((res) => {
      const filtered = res.filter((e) => e.budget_id === this.budgetId);
      this.expenseTableData = this.expenseService.buildExpenseTable(filtered);
    });
  }

  /** ✅ NEW: Sync the current budget with its expenses */
  private syncBudgetWithExpenses(budgets: any[], expenses: Expense[]): void {
    const budget = budgets.find((b) => b.id === this.budgetId);
    if (!budget) return;

    const spentForBudget = expenses
      .filter((e) => e.budget_id === this.budgetId)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Update the budget card dynamically
    this.budgetCard = {
      id: budget.id,
      name: budget.name,
      budget: budget.budget,
      spent: spentForBudget,
      color: budget.color,
      onClick: () => this.deleteBudget(),
    };

    // Update the table for this budget
    const filteredExpenses = expenses.filter((e) => e.budget_id === this.budgetId);
    this.expenseTableData = this.expenseService.buildExpenseTable(filteredExpenses);
  }

  /** ➕ Add a new expense for this budget */
  async addExpense(): Promise<void> {
    const userId = this.userService.getUserSync()?.id;
    if (!userId) {
      this.showMessage('Please log in to add expenses.');
      return;
    }

    const newExpense: Expense = {
      id: uuidv4(),
      user_id: userId,
      budget_id: this.budgetId,
      name: this.expenseForm.value.name,
      amount: Number(this.expenseForm.value.amount),
      created_at: new Date().toISOString(),
    };

    try {
      await this.expenseService.createExpense(newExpense);
      this.expenseForm.reset();
    } catch (err: any) {
      this.showMessage(err?.message || 'Failed to add expense.');
    }
  }

  /** 🗑️ Delete entire budget (cascade deletes expenses) */
  async deleteBudget(): Promise<void> {
    try {
      await this.budgetService.deleteBudgetById(this.budgetId);
      const userId = this.userService.getUserSync()?.id;
      if (userId) await this.expenseService.refreshExpensesAfterBudgetDelete(userId);
      // ✅ Redirect to Home after successful delete
      this.router.navigateByUrl('/home');
    } catch (err: any) {
      this.showMessage(err?.message || 'Failed to delete budget.');
    }
  }

  /** 🗑️ Delete a single expense */
  async handleAction(event: TableDataConfig): Promise<void> {
    try {
      await this.expenseService.deleteExpenseById(event.id);
    } catch (err: any) {
      this.showMessage(err?.message || 'Failed to delete expense.');
    }
  }

  /** 🔸 Popup helper */
  private showMessage(msg: string): void {
    this.popupMessage = msg;
    this.showPopup = true;
  }
}
