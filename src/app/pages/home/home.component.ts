import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { FormWrapperComponent } from '../../components/form-wrapper/form-wrapper.component';
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BarChartComponent , FormWrapperComponent, ReactiveFormsModule, BudgetCardComponent, TableComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  budgetCategories: BudgetCategory[] = [];
  budgets: Budget[] = [];
  budgetCards: BudgetCardConfig[] = [];
  expenseTableData: TableDataConfig[] = [];
  expensesData: Expense[] = [];

  chartPayload = {
    labels: [] as string[],
    values: [] as number[],
    colors: [] as string[],
    meta: { totalBudgeted: 0, totalSpent: 0, overallUtil: 0 }
  };

  constructor(private uiService: UiService, private router: Router, public userService: UserService, private budgetService: BudgetService, private expenseService: ExpenseService) { }

  budgetForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    budget: new FormControl(null, [Validators.required])
  })

  expenseForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    amount: new FormControl(null, [Validators.required]),
    budgetCategoryId: new FormControl(null, [Validators.required])
  })

  ngOnInit() {
    this.budgetCategories = this.budgetService.getBudgetCategories();
    this.budgets = this.budgetService.getBudgets();
    this.buildBudgetCards(this.budgets);

    this.updateChartData();

    this.budgetService.getBudgetData().subscribe({
      next: (res: Budget[]) => {
        this.budgets = res;
        this.buildBudgetCards(this.budgets);
        this.updateChartData(); // ✅ Refresh chart
      },
      error: (error: any) => {
        console.error(error)
      }
    })

    this.budgetService.getBudgetCategoryData().subscribe({
      next: (res: BudgetCategory[]) => {
        this.budgetCategories = res;
      },
      error: (error: any) => {
        console.error(error)
      }
    })

    this.expensesData  = this.expenseService.getExpenses();
    this.expenseTableData = this.expenseService.buildExpenseTable(this.expensesData);
    this.expenseService.getExpenseData().subscribe({
      next: (res: Expense[]) => {
        this.expensesData = res;
        this.expenseTableData = this.expenseService.buildExpenseTable(res);
        this.updateChartData(); // ✅ Refresh chart
      },
      error: (error: any) => {
        console.error(error)
      }
    });
  }

  addBudget() {
    const budget: Budget = {
      id: uuidv4(),
      name: this.budgetForm.value.name,
      budget: this.budgetForm.value.budget,
      spent: 0,
      color: this.uiService.generateRandomColor(this.budgets.length + 1)
    }
    this.budgetService.addBudget(budget);
    this.budgetForm.reset();
    this.updateChartData(); // ✅ Refresh chart
  }

  addExpense() {
    const category = this.budgetService.getBudgetById(this.expenseForm.value.budgetCategoryId)
    const expense: Expense = {
      id: uuidv4(),
      name: this.expenseForm.value.name,
      budgetCategory: category,
      amount: parseFloat(this.expenseForm.value.amount),
      date: new Date()
    }
    // add expense
    this.expenseService.addExpense(expense);
    this.expenseForm.reset();
    this.updateChartData(); // ✅ Refresh chart
  }

  updateChartData() {
    const budgets = this.budgetService.getBudgets();
    const expenses = this.expenseService.getExpenses();

    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    let totalBudgeted = 0;
    let totalSpent = 0;

    budgets.forEach((budget) => {
      const spentForBudget = expenses
        .filter((e) => e.budgetCategory.id === budget.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const utilization = budget.budget > 0
        ? (spentForBudget / budget.budget) * 100
        : 0;

      labels.push(budget.name);
      values.push(Math.round(utilization));
      const colorMap: any = { red: '#dc2626', amber: '#d97706', blue: '#3b82f6' };
      colors.push(colorMap[budget.color] || '#6b7280');

      totalBudgeted += budget.budget;
      totalSpent += spentForBudget;
    });

    const overallUtil = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    this.chartPayload = {
      labels,
      values,
      colors: colors,
      meta: {
        totalBudgeted,
        totalSpent,
        overallUtil
      }
    };
  }

  handleDelete(event: TableDataConfig) {
    this.expenseService.deleteExpenseById(event.id);
  }

  buildBudgetCards(budgets: Budget[]) {
    this.budgetCards = budgets.map((item: Budget) => {
      return {
        name: item.name,
        budget: item.budget,
        spent: item.spent,
        color: item.color,
        onClick: () => {
          this.router.navigateByUrl(`details/${item.id}`);
        }
      }
    })
  }
}
