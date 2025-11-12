export const environment = {
  production: true,
  supabaseUrl: (window as any)['NG_APP_SUPABASE_URL'] || '',
  supabaseAnonKey: (window as any)['NG_APP_SUPABASE_ANON_KEY'] || ''
};
