import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss'
})
export class PopupComponent {
  @Input() message: string = '';
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();

  closePopup() {
    this.close.emit();
  }
}
