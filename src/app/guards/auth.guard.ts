import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { dashboardPourRole } from '../services/role-routes';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (stored && token) {
    try {
      const user = JSON.parse(stored);
      if (user && user.id) {
        const roles = route.data?.['roles'] as string[] | undefined;
        if (!roles || roles.includes(user.role)) return true;
        // Connecté mais non autorisé sur cette page → renvoyé vers son propre dashboard
        router.navigate([dashboardPourRole(user.role)], { replaceUrl: true });
        return false;
      }
    } catch {
      // ignore, treat as not authenticated
    }
  }
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};
