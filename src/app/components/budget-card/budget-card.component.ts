// src/app/components/budget-card/budget-card.component.ts
import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { BudgetCardConfig } from '../../interfaces/ui-config/budget-card-config.interface';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-budget-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-card.component.html',
  styleUrl: './budget-card.component.scss',
  // ✅ Use OnPush for performance — updates only when @Input() changes
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetCardComponent implements OnChanges {
  /** Budget details passed from parent */
  @Input() config!: BudgetCardConfig;
  @Input() isDelete = false;

  /** Computed Tailwind classes for UI */
  bgColor = '';
  textColor = '';
  borderColor = '';

  constructor(private uiService: UiService) {}

  /**
   * Whenever the input config changes (like updated spent, budget),
   * re-generate display colors & ensure progress reflects latest data.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.borderColor = this.uiService.generateTailwindClass(this.config.color, 'border');
      this.textColor = this.uiService.generateTailwindClass(this.config.color, 'text');
      this.bgColor = this.uiService.generateTailwindClass(this.config.color, 'bg');
    }
  }

  /**
   * Compute percentage width for progress bar dynamically.
   * Protects against divide-by-zero and caps at 100%.
   */
  calculatePercentage(): string {
    if (!this.config?.budget || this.config.budget <= 0) return '0%';
    const percent = (this.config.spent / this.config.budget) * 100;
    return Math.min(percent, 100).toFixed(2) + '%';
  }

  /** Trigger navigation or delete callback when clicked */
  viewDetails() {
    if (this.config?.onClick) {
      this.config.onClick();
    }
  }
}
