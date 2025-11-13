// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '../components/types/user.type';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSub = new BehaviorSubject<User | null>(null);

  constructor(private router: Router, private supabaseService: SupabaseService) {
    this.initAuthListener();
  }

  /** Initialize auth listener and try to load current session/user right away */
  private async initAuthListener() {
    const client = this.supabaseService.getClient();

    // Try to load current session/user on startup
    try {
      const { data: sessionData } = await client.auth.getSession();
      if (sessionData?.session?.user) {
        this.setUserFromSupabase(sessionData.session.user);
      } else {
        this.userSub.next(null);
      }
    } catch (err) {
      this.userSub.next(null);
    }

    // Listen for future user auth state changes
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.setUserFromSupabase(session.user);
      } else {
        this.userSub.next(null);
      }
    });
  }

  private setUserFromSupabase(rawUser: any) {
    const normalized: User = {
      id: rawUser.id,
      email: rawUser.email ?? '',
      phone: rawUser.phone ?? '',
      user_metadata: {
        name: rawUser.user_metadata?.displayName ?? '',
      },
    };
    this.userSub.next(normalized);
  }

  /** Observable UI components can subscribe to */
  get user$(): Observable<User | null> {
    return this.userSub.asObservable();
  }

  /** synchronous check — safe because it reads BehaviorSubject current value */
  isLoggedin(): boolean {
    return !!this.userSub.value;
  }

  getUserSync(): User | null {
    return this.userSub.value;
  }

  async deleteUserAccount() {
    // Sign out at backend
    await this.supabaseService.signOut();
    // Clear local state
    this.userSub.next(null);
    // Redirect to create-account
    this.router.navigateByUrl('/create-account');
  }

  async deleteUserCompletely() {
    const client = this.supabaseService.getClient();
    const user = this.getUserSync();
    if (!user) return;

    const userId = user.id;

    // Build edge function URL
    const url = `${environment.supabaseUrl}/functions/v1/delete-user`;

    // Call edge function
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass anon key (allowed for Edge Function access)
        "Authorization": `Bearer ${environment.supabaseAnonKey}`
      },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete user");
    }

    // Logout locally
    await this.supabaseService.signOut();
    this.userSub.next(null);

    // Redirect
    this.router.navigateByUrl('/create-account');
  }
}
