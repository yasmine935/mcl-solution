import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user && user.id) return true;
    } catch {
      // ignore, treat as not authenticated
    }
  }
  router.navigate(['/login'], { replaceUrl: true });
  return false;
};
