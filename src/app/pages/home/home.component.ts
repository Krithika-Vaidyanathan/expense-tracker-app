// src/app/pages/home/home.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { ExpenseService } from '../../services/expense.service';
import { BudgetCategory } from '../../interfaces/models/budget-category.interface';
import { Budget } from '../../interfaces/models/budget.interface';
import { v4 as uuidv4 } from 'uuid';
import { BudgetCardConfig } from '../../interfaces/ui-config/budget-card-config.interface';
import { Router } from '@angular/router';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { UiService } from '../../services/ui.service';
import { Expense } from '../../interfaces/models/expense.interface';
import { TableDataConfig } from '../../interfaces/models/table-data-config.interface';
import { TableComponent } from '../../components/table/table.component';
import { BarChartComponent } from '../../components/bar-chart/bar-chart.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { User } from '../../components/types/user.type';
import { FormWrapperComponent } from '../../components/form-wrapper/form-wrapper.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PopupComponent,
    BarChartComponent,
    FormWrapperComponent,
    ReactiveFormsModule,
    BudgetCardComponent,
    TableComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  /** Logged-in user info */
  user: User | null = null;

  /** Data models */
  budgetCategories: BudgetCategory[] = [];
  budgets: Budget[] = [];
  budgetCards: BudgetCardConfig[] = [];
  expenseTableData: TableDataConfig[] = [];
  expensesData: Expense[] = [];

  showPopup = false;
  popupMessage = '';

  /** Chart payload */
  chartPayload = {
    labels: [] as string[],
    values: [] as number[],
    colors: [] as string[],
    meta: { totalBudgeted: 0, totalSpent: 0, overallUtil: 0 },
  };

  /** Forms */
  budgetForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    budget: new FormControl<number | null>(null, [Validators.required]),
  });

  expenseForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required]),
    budgetCategoryId: new FormControl<string | null>(null, [Validators.required]),
  });

  /** Subscription destroyer */
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UiService,
    private router: Router,
    public userService: UserService,
    private budgetService: BudgetService,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    /** 1️⃣ Watch user login/logout */
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe(async (u) => {
      this.user = u;
      if (this.user?.id) {
        await this.loadBudgetsAndExpenses(this.user.id);
      } else {
        this.clearUiData();
      }
    });

    /** 2️⃣ Keep categories live */
    this.budgetService
      .getBudgetCategoryData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => (this.budgetCategories = cats || []));

    /** 3️⃣ Unified reactive stream: budgets + expenses */
    combineLatest([
      this.budgetService.getBudgetData(),
      this.expenseService.getExpenseData(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([budgetList, expenseList]) => {
        this.syncUiWithData(budgetList || [], expenseList || []);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ========================================================
     🧩 Data Boot: Load budgets & expenses from Supabase
  ======================================================== */
  private async loadBudgetsAndExpenses(userId: string) {
    try {
      // Both services fetch + emit through BehaviorSubjects
      await Promise.all([
        this.budgetService.loadBudgetsForUser(userId),
        this.expenseService.loadExpensesForUser(userId),
      ]);
    } catch (err: any) {
      console.error('Failed to load budgets/expenses', err);
      this.popupMessage = 'Failed to load your data. Please try again.';
      this.showPopup = true;
    }
  }

  /* ========================================================
     🔁 UI Sync Helper
     Keeps data consistent between budgets, expenses, and UI
  ======================================================== */
  private syncUiWithData(budgets: Budget[], expenses: Expense[]): void {
    this.budgets = budgets.map((b) => {
      const spentForBudget = expenses
        .filter((e) => e.budget_id === b.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return { ...b, spent: spentForBudget }; // enrich each budget with real-time spent
    });

    this.expensesData = expenses;

    // 1️⃣ Build Cards with latest spent values
    this.buildBudgetCards(this.budgets);

    // 2️⃣ Build Expense Table
    this.expenseTableData = this.expenseService.buildExpenseTable(this.expensesData);

    // 3️⃣ Update Chart
    this.updateChartData(this.budgets, this.expensesData);
  }

  /* ========================================================
     ➕ Create Budget / Expense
  ======================================================== */
  async addBudget() {
    if (!this.user?.id) {
      this.showMessage('Please log in to create budgets.');
      return;
    }
    if (this.budgets.length >= 10) {
      this.showMessage('You can create up to 10 budgets only.');
      return;
    }

    const newBudget: Budget = {
      id: uuidv4(),
      user_id: this.user.id,
      name: this.budgetForm.value.name,
      budget: Number(this.budgetForm.value.budget),
      spent: 0,
      color: this.uiService.generateRandomColor(this.budgets.length + 1),
      created_at: new Date().toISOString(),
    };

    try {
      await this.budgetService.createBudget(newBudget);
      this.budgetForm.reset();
    } catch (err: any) {
      this.showMessage(err?.message || 'Failed to create budget.');
    }
  }

  async addExpense() {
    if (!this.user?.id) return this.showMessage('Please log in to add expenses.');

    const budgetId = this.expenseForm.value.budgetCategoryId;
    if (!budgetId) return this.showMessage('Please select a budget category.');

    const targetBudget = this.budgets.find((b) => b.id === budgetId);
    if (!targetBudget) return this.showMessage('Selected budget not found.');

    const newExpense: Expense = {
      id: uuidv4(),
      user_id: this.user.id,
      budget_id: budgetId,
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

  /* ========================================================
     🗑️ Delete Flows
  ======================================================== */
  async handleDelete(event: TableDataConfig) {
    try {
      await this.expenseService.deleteExpenseById(event.id);
    } catch (err: any) {
      this.showMessage(err?.message || 'Failed to delete expense.');
    }
  }

  // async deleteBudget(budgetId: string) {
  //   try {
  //     await this.budgetService.deleteBudgetById(budgetId);
  //   } catch (err: any) {
  //     this.showMessage(err?.message || 'Failed to delete budget.');
  //   }
  // }

  /* ========================================================
     🧮 UI Helpers
  ======================================================== */
  private buildBudgetCards(budgets: Budget[]): void {
    this.budgetCards = budgets.map((item) => ({
      id: item.id,
      name: item.name,
      budget: item.budget,
      spent: item.spent,
      color: item.color,
      onClick: () => this.router.navigateByUrl(`details/${item.id}`),
    }));
  }

  private updateChartData(budgets: Budget[], expenses: Expense[]): void {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    let totalBudgeted = 0;
    let totalSpent = 0;

    budgets.forEach((budget) => {
      const spentForBudget = expenses
        .filter((e) => e.budget_id === budget.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const utilization = budget.budget > 0 ? (spentForBudget / budget.budget) * 100 : 0;
      labels.push(budget.name);
      values.push(Math.round(utilization));

      const colorMap: any = { red: '#dc2626', amber: '#d97706', blue: '#3b82f6' };
      colors.push(colorMap[budget.color] || '#6b7280');

      totalBudgeted += budget.budget || 0;
      totalSpent += spentForBudget;
    });

    const overallUtil = totalBudgeted > 0
      ? Number(((totalSpent / totalBudgeted) * 100).toFixed(2))
      : 0; this.chartPayload = { labels, values, colors, meta: { totalBudgeted, totalSpent, overallUtil } };
  }

  private clearUiData(): void {
    this.budgets = [];
    this.budgetCards = [];
    this.expensesData = [];
    this.expenseTableData = [];
    this.updateChartData([], []);
  }

  private showMessage(msg: string): void {
    this.popupMessage = msg;
    this.showPopup = true;
  }
}
