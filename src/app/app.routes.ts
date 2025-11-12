import { Routes } from '@angular/router';
import { BudgetDetailsComponent } from './pages/budget-details/budget-details.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'details/:id', component: BudgetDetailsComponent },
  {
    path: 'create-account',
    loadComponent: () =>
      import('./pages/create-account/create-account.component')
        .then((c) => c.CreateAccountComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component')
        .then((c) => c.HomeComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/create-account', pathMatch: 'full' },

];
