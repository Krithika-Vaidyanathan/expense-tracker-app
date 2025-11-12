import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  // const router = inject(Router);
  // const userService = inject(UserService);

  // // Only protect home and details routes
  // const protectedRoutes = ['/home', '/details'];

  // const needsAuth = protectedRoutes.some(p => state.url.startsWith(p));

  // if (needsAuth && !userService.isLoggedin()) {
  //   router.navigateByUrl('/login');
  //   return false;
  // }

  // return true;


  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabaseService.getUser();
  if (!data.user) {
    router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  return true;
};
