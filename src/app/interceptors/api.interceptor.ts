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

  // Joint le jeton JWT à toutes les requêtes API quand il existe
  const token = localStorage.getItem('token');
  if (token) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(request).pipe(
    catchError((err) => {
      // Jeton absent, invalide ou expiré → retour au login.
      // Exceptions : échec du login lui-même, et change-password (401 = mot de passe actuel incorrect)
      const isAuthAttempt = request.url.includes('/api/auth/login')
        || request.url.includes('/api/auth/change-password');
      if (err?.status === 401 && !isAuthAttempt) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.navigate(['/login'], { replaceUrl: true });
      }
      return throwError(() => err);
    })
  );
};
