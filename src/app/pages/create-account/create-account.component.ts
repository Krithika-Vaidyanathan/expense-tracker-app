import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss'
})
export class CreateAccountComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // Toggle between login and signup
  isLoginMode = signal(true);

  // Login inputs
  email = signal('');
  password = signal('');

  // Signup inputs
  name = signal('');
  signupEmail = signal('');
  signupPassword = signal('');

  // Optional form for initial account name (you can later connect this)
  accountForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  toggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
  }

  async signInWithEmail() {
    const { error } = await this.supabaseService.signInWithEmail({
      email: this.email(),
      password: this.password(),
    });
    if (error) {
      alert('Error signing in: ' + error.message);
    } else {
      this.router.navigate(['/home']);
    }
  }

  async signUp() {
    const { error } = await this.supabaseService.signUpWithEmail({
      name: this.name(),
      email: this.signupEmail(),
      password: this.signupPassword(),
    });
    if (error) {
      alert('Error signing up: ' + error.message);
    } else {
      alert('Account created successfully! You can now log in using your credentials.');
      this.isLoginMode.set(true);
    }
  }
}
