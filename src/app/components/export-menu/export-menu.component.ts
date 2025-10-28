import { Component, HostListener, Input } from '@angular/core';
import { DataExportService } from '../../services/data-export.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-menu.component.html',
  styleUrl: './export-menu.component.scss'
})
export class ExportMenuComponent {

  @Input() data: any[] = []; // Accepts array of expenses or budgets

  showMenu = false;

  constructor(private exportService: DataExportService) { }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-menu-container')) {
      this.showMenu = false;
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  exportCSV() {
    if (!this.data?.length) return;
    this.exportService.exportAsCSV(this.data);
    this.showMenu = false;
  }

  exportPDF() {
    if (!this.data?.length) return;
    this.exportService.exportAsPDF(this.data);
    this.showMenu = false;
  }

}
