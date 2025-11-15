import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { LoginPayload, SignupPayload } from '../components/types/user.type';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true, // ✅ Keeps user logged in on reload
        autoRefreshToken: true, // ✅ Refreshes access token automatically
        detectSessionInUrl: true, // ✅ Useful if login redirects happen via email magic links
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async signInWithEmail(payload: LoginPayload) {
    return await this.supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
  }

  async signUpWithEmail(payload: SignupPayload) {
    return await this.supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { displayName: payload.name },
      },
    });
  }

  async getUser() {
    return await this.supabase.auth.getUser();
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async submitFeedback(message: string) {
    const {
      data: { user },
      error: userError
    } = await this.supabase.auth.getUser();

    if (userError) return { error: userError };
    if (!user) return { error: { message: 'User not authenticated' } };

    const { error } = await this.supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        email: user.email,
        message: message
      });

    return { error };
  }

}
