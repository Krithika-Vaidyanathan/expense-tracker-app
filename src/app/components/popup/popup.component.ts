import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  @Input() visible: boolean = false;
  @Input() title: string = 'Notification';
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() confirmMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
  
  closePopup() {
    this.close.emit();
  }
}
