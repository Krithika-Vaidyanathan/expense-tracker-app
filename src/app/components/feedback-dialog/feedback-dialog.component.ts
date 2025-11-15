import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
@Component({
  selector: 'app-feedback-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.scss'
})
export class FeedbackDialogComponent {

  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  message = '';
  submitting = false;
  success = '';
  error = '';

  constructor(private supabase: SupabaseService) {}

  async submit() {
    if (!this.message.trim()) {
      this.error = 'Please enter your feedback.';
      return;
    }

    this.error = '';
    this.success = '';
    this.submitting = true;

    const { error } = await this.supabase.submitFeedback(this.message.trim());

    this.submitting = false;

    if (error) {
      this.error = 'Something went wrong. Try again.';
    } else {
      this.success = 'Feedback submitted!';
      this.message = '';

      setTimeout(() => this.close.emit(), 1000);
    }
   }
}

