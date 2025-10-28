import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class DataExportService {

  exportAsCSV(data: any[]) {
    if (!data.length) return;

    // ✅ Step 1: Format expense rows
    const expenseRows = data.map(item => ({
      'Expense Name': item.name,
      'Expense Amount ($)': "$"+item.amount,
      'Budget Category': item.budgetCategory?.name || 'N/A',
      'Budget Limit ($)': "$"+item.budgetCategory?.budget || 0,
      'Date': this.formatDate(item.date)
    }));

    // ✅ Step 2: Compute category summary
    const categoryMap = new Map<string, { spent: number, budget: number }>();
    data.forEach(exp => {
      const catName = exp.budgetCategory?.name || 'N/A';
      const catBudget = exp.budgetCategory?.budget || 0;
      const entry = categoryMap.get(catName) || { spent: 0, budget: catBudget };
      entry.spent += exp.amount;
      entry.budget = catBudget;
      categoryMap.set(catName, entry);
    });

    const categorySummary = Array.from(categoryMap.entries()).map(([name, val]) => ({
      'Budget Category': name,
      'Total Spent ($)': "$"+Math.round(val.spent),
      'Budget Limit ($)': "$"+Math.round(val.budget),
      'Utilization (%)': val.budget > 0 ? Math.round((val.spent / val.budget) * 100)+"%" : 0
    }));

    // ✅ Step 3: Build CSV string
    const expenseHeaders = Object.keys(expenseRows[0]);
    const summaryHeaders = Object.keys(categorySummary[0]);

    let csvContent = '--- Expense Details ---\n';
    csvContent += [
      expenseHeaders.join(','),
      ...expenseRows.map(row =>
        expenseHeaders.map(h => (row as Record<string, any>)[h]).join(',')
      )
    ].join('\n');

    csvContent += '\n\n--- Category Summary ---\n';
    csvContent += [
      summaryHeaders.join(','),
      ...categorySummary.map(row =>
        summaryHeaders.map(h => (row as Record<string, any>)[h]).join(',')
      )
    ].join('\n');

    // ✅ Step 4: Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAsPDF(data: any[]) {
    if (!data.length) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Expense Report', 14, 15);

    // ✅ Expense details section
    const expenseData = data.map(item => ({
      'Expense Name': item.name,
      'Expense Amount ($)': "$"+item.amount,
      'Budget Category': item.budgetCategory?.name || 'N/A',
      'Budget Limit ($)': "$"+item.budgetCategory?.budget || 0,
      'Date': this.formatDate(item.date)
    }));

    const expenseHeaders = Object.keys(expenseData[0]);
    const expenseRows = expenseData.map(item =>
      expenseHeaders.map(h => (item as Record<string, any>)[h])
    );

    (autoTable as any)(doc, {
      startY: 25,
      head: [expenseHeaders],
      body: expenseRows,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 11, cellPadding: 3 },
      styles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left' } }
    });

    // ✅ Category Summary section
    const categoryMap = new Map<string, { spent: number, budget: number }>();
    data.forEach(exp => {
      const catName = exp.budgetCategory?.name || 'N/A';
      const catBudget = exp.budgetCategory?.budget || 0;
      const entry = categoryMap.get(catName) || { spent: 0, budget: catBudget };
      entry.spent += exp.amount;
      entry.budget = catBudget;
      categoryMap.set(catName, entry);
    });

    const categorySummary = Array.from(categoryMap.entries()).map(([name, val]) => ({
      'Budget Category': name,
      'Total Spent ($)': "$"+Math.round(val.spent),
      'Budget Limit ($)': "$"+Math.round(val.budget),
      'Utilization (%)': val.budget > 0 ? Math.round((val.spent / val.budget) * 100)+"%" : 0
    }));

    const summaryHeaders = Object.keys(categorySummary[0]);
    const summaryRows = categorySummary.map(item =>
      summaryHeaders.map(h => (item as Record<string, any>)[h])
    );

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Category Summary', 14, finalY);

    (autoTable as any)(doc, {
      startY: finalY + 5,
      head: [summaryHeaders],
      body: summaryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [60, 60, 60],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 11, cellPadding: 3 },
      styles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left' } }
    });

    doc.save('expenses_report.pdf');
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
