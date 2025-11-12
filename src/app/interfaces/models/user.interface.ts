// Represents the authenticated Supabase user
export interface User {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
}