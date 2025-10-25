import { Component, OnInit } from '@angular/core';
import { TableDataConfig } from '../../interfaces/models/table-data-config.interface';
import { Expense } from '../../interfaces/models/expense.interface';
import { ExpenseService } from '../../services/expense.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BudgetService } from '../../services/budget.service';
import { UiService } from '../../services/ui.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetCardConfig } from '../../interfaces/ui-config/budget-card-config.interface';
import { v4 as uuidv4 } from 'uuid';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { FormWrapperComponent } from '../../components/form-wrapper/form-wrapper.component';
import { TableComponent } from '../../components/table/table.component';
@Component({
  selector: 'app-budget-details',
  standalone: true,
  imports: [ReactiveFormsModule, BudgetCardComponent, FormWrapperComponent, TableComponent],
  templateUrl: './budget-details.component.html',
  styleUrl: './budget-details.component.scss'
})
export class BudgetDetailsComponent implements OnInit {

  budgetCard!: BudgetCardConfig;
  expenseTableData: TableDataConfig[] =[];
  budgetId : string = '';

  expenseForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    amount: new FormControl(null, [Validators.required]),
  })
  

  constructor (private router : Router, private budgetService: BudgetService, public uiService: UiService,
    private expenseService: ExpenseService, private activatedRoute: ActivatedRoute) {}
  ngOnInit(): void {
      this.activatedRoute.params.subscribe((params: Params) => {
        this.budgetId = params['id'];
        this.initializeData();

        const expenses= this.expenseService.getExpensesByBudgetId(this.budgetId);
        this.expenseTableData = this.expenseService.buildExpenseTable(expenses);
        
        this.expenseService.getExpenseData().subscribe({
          next: (res: Expense[]) => {
            const expenses= this.expenseService.getExpensesByBudgetId(this.budgetId);
            this.expenseTableData = this.expenseService.buildExpenseTable(expenses);
          },  
          error: (error: any) =>{
            console.error(error)
          }
        });
      })
  } 

  addExpense() {
    const category = this.budgetService.getBudgetCategoryById(this.budgetId);
    const expense: Expense ={
      id: uuidv4(),
      name: this.expenseForm.value.name,
      budgetCategory: category,
      amount: parseInt(this.expenseForm.value.amount),
      date: new Date()
    }

    this.expenseService.addExpense(expense);
    this.expenseForm.reset();

    this.initializeData();
  }

  initializeData() {
    const budget = this.budgetService.getBudgetById(this.budgetId);

    this.budgetCard = {
      name: budget.name,
      budget: budget.budget,
      spent: budget.spent,
      color: budget.color,
      onClick: () => {
        this.deleteBudget() 
      }
    }
  }

  deleteBudget() {
    this.expenseService.deleteExpenseBudgetId(this.budgetId);
    this.budgetService.deleteBudgetById(this.budgetId);
    this.router.navigateByUrl('');
  }

  handleAction($event: TableDataConfig){
    this.expenseService.deleteExpenseById($event.id);
    this.initializeData();
  }
}
