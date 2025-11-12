import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BudgetService } from './budget.service';
import { Expense } from '../interfaces/models/expense.interface';
import { Budget } from '../interfaces/models/budget.interface';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class DataExportService {
  constructor(private budgetService: BudgetService, private userService: UserService) { }

  /** =========================
   * 🧩 Export data as CSV
   * ========================= */
  exportAsCSV(data: Expense[]) {
    if (!data.length) return;

    // ✅ Get budgets snapshot from BehaviorSubject
    const budgets = this.budgetService['budgets$']?.value || [];

    // ✅ Build expense rows
    const expenseRows = data.map((item) => {
      const budget = budgets.find((b: Budget) => b.id === item.budget_id);
      return {
        'Expense Name': item.name,
        'Amount ($)': `$${item.amount}`,
        'Budget Name': budget?.name || 'N/A',
        'Budget Limit ($)': `$${budget?.budget || 0}`,
        'Date': this.formatDate(item.created_at),
      };
    });

    // ✅ Compute category summary
    const categoryMap = new Map<string, { spent: number; limit: number }>();
    expenseRows.forEach((row) => {
      const name = row['Budget Name'];
      const limit = Number((row['Budget Limit ($)'] || '').replace('$', '')) || 0;
      const spent = Number((row['Amount ($)'] || '').replace('$', '')) || 0;

      const entry = categoryMap.get(name) || { spent: 0, limit };
      entry.spent += spent;
      entry.limit = limit;
      categoryMap.set(name, entry);
    });

    const categorySummary = Array.from(categoryMap.entries()).map(([name, val]) => ({
      'Budget Name': name,
      'Total Spent ($)': `$${val.spent}`,
      'Budget Limit ($)': `$${val.limit}`,
      'Utilization (%)': val.limit > 0 ? `${((val.spent / val.limit) * 100).toFixed(2)}%` : '0%',
    }));

    // ✅ Build CSV
    const expenseHeaders = Object.keys(expenseRows[0]);
    const summaryHeaders = Object.keys(categorySummary[0]);

    let csvContent = `Expense Report - ${new Date().toLocaleDateString()}\n\n--- Expense Details ---\n`;
    csvContent += [
      expenseHeaders.join(','),
      ...expenseRows.map((row) =>
        expenseHeaders.map((h) => (row as Record<string, string>)[h]).join(',')
      ),
    ].join('\n');

    csvContent += '\n\n--- Budget Summary ---\n';
    csvContent += [
      summaryHeaders.join(','),
      ...categorySummary.map((row) =>
        summaryHeaders.map((h) => (row as Record<string, string>)[h]).join(',')
      ),
    ].join('\n');

    // ✅ Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.getFileName('expenses-report')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** =========================
   * 🧾 Export data as PDF
   * ========================= */
  exportAsPDF(data: Expense[]) {
    if (!data.length) return;

    const budgets = this.budgetService['budgets$']?.value || [];
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Expense Report - ${this.formatDate(new Date())}`, 14, 15);

    // ✅ Expense Table
    const expenseData = data.map((item) => {
      const budget = budgets.find((b: Budget) => b.id === item.budget_id);
      return {
        'Expense Name': item.name,
        'Amount ($)': `$${item.amount}`,
        'Budget Name': budget?.name || 'N/A',
        'Budget Limit ($)': `$${budget?.budget || 0}`,
        'Date': this.formatDate(item.created_at),
      };
    });

    const headers = Object.keys(expenseData[0]);
    const rows = expenseData.map((r) =>
      headers.map((h) => (r as Record<string, string>)[h])
    );

    (autoTable as any)(doc, {
      startY: 25,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 11, cellPadding: 3 },
      styles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
    });

    // ✅ Budget Summary Table
    const categoryMap = new Map<string, { spent: number; limit: number }>();
    expenseData.forEach((r) => {
      const name = (r as Record<string, string>)['Budget Name'];
      const limit = Number(((r as Record<string, string>)['Budget Limit ($)'] || '').replace('$', '')) || 0;
      const spent = Number(((r as Record<string, string>)['Amount ($)'] || '').replace('$', '')) || 0;

      const entry = categoryMap.get(name) || { spent: 0, limit };
      entry.spent += spent;
      entry.limit = limit;
      categoryMap.set(name, entry);
    });

    const summary = Array.from(categoryMap.entries()).map(([name, val]) => ({
      'Budget Name': name,
      'Total Spent ($)': `$${val.spent}`,
      'Budget Limit ($)': `$${val.limit}`,
      'Utilization (%)': val.limit > 0 ? `${((val.spent / val.limit) * 100).toFixed(2)}%` : '0%',
    }));

    const sHeaders = Object.keys(summary[0]);
    const sRows = summary.map((r) =>
      sHeaders.map((h) => (r as Record<string, string>)[h])
    );

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Budget Summary', 14, finalY);

    (autoTable as any)(doc, {
      startY: finalY + 5,
      head: [sHeaders],
      body: sRows,
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 11, cellPadding: 3 },
      styles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
    });

    doc.save(`${this.getFileName('expenses-report')}.pdf`);
  }

  /** =========================
   * 🧮 Helpers
   * ========================= */
  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private getFileName(prefix: string): string {
    const userName =
      this.userService.getUserSync()?.user_metadata?.name?.replace(/\s+/g, '-') || 'user';
    const date = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
    return `${prefix}-${date}-${userName}`;
  }

}
