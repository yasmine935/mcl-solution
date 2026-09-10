import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SERVER_URL } from '../server.config';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let request = req;
  if (request.url.includes('localhost:8080') || request.url.startsWith('http://localhost:8080')) {
    request = request.clone({ url: request.url.replace('http://localhost:8080', SERVER_URL) });
  }

  // Le jeton n'est joint qu'aux requêtes vers NOTRE API — jamais vers un domaine tiers
  const token = localStorage.getItem('token');
  const versApi = request.url.startsWith(SERVER_URL);
  if (token && versApi) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(request).pipe(
    catchError((err) => {
      // Jeton invalide ou expiré → retour au login.
      // Uniquement si un jeton était réellement joint : un visiteur anonyme qui reçoit
      // un 401 (écran public) ne doit pas être redirigé.
      // Exceptions : le login lui-même et change-password (401 = mauvais mot de passe).
      const isAuthAttempt = request.url.includes('/api/auth/login')
        || request.url.includes('/api/auth/change-password');
      if (err?.status === 401 && token && versApi && !isAuthAttempt) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.navigate(['/login'], { replaceUrl: true });
      }
      return throwError(() => err);
    })
  );
};
