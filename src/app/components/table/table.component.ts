import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableDataConfig } from '../../interfaces/models/table-data-config.interface';
import { UiService } from '../../services/ui.service';
import { CamelcasePipe } from '../../pipes/camelcase.pipe';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CamelcasePipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  @Input() data: TableDataConfig[] = [];
  @Output() removeRow: EventEmitter<TableDataConfig> = new EventEmitter();

  constructor(public uiService: UiService) {
  }

  handleAction(item: TableDataConfig) {
    this.removeRow.emit(item);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

}
