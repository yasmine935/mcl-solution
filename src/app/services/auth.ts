import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SERVER_URL } from '../server.config';

export interface UtilisateurConnecte {
  id: number;
  nom?: string;
  prenom?: string;
  username?: string;
  role?: string;
  premierConnexion?: boolean;
  [cle: string]: unknown;
}

export interface LoginResponse {
  token: string;
  user: UtilisateurConnecte;
}

/**
 * Service d'authentification : login, changement de mot de passe, session.
 * Seul endroit du frontend qui écrit le jeton et l'utilisateur dans le localStorage.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly api = `${SERVER_URL}/api/auth`;

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, { username, password }).pipe(
      // Le jeton est stocké immédiatement ; l'utilisateur ne l'est qu'une fois
      // le mot de passe temporaire changé (voir persisterSession)
      tap((res) => localStorage.setItem('token', res.token))
    );
  }

  /** À appeler une fois le flux de connexion terminé (pas de mot de passe temporaire en attente). */
  persisterSession(user: UtilisateurConnecte): void {
    const { password: _pwd, ...safeUser } = user as Record<string, unknown>;
    localStorage.setItem('user', JSON.stringify(safeUser));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.put(`${this.api}/change-password`,
      { currentPassword, newPassword }, { responseType: 'text' });
  }

  forgotPassword(username: string): Observable<string> {
    return this.http.post(`${this.api}/forgot-password`, { username }, { responseType: 'text' });
  }

  // ── Reset de mot de passe côté admin (rôle ADMINISTRATEUR requis par le backend) ──

  demandesReset(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/reset-requests`);
  }

  reinitialiserMotDePasse(demandeId: number, newPassword: string): Observable<string> {
    return this.http.put(`${this.api}/reset-requests/${demandeId}/reset`,
      { newPassword }, { responseType: 'text' });
  }

  utilisateurCourant(): UtilisateurConnecte | null {
    try {
      const stored = localStorage.getItem('user');
      if (!stored || !localStorage.getItem('token')) return null;
      const user = JSON.parse(stored);
      return user?.id ? user : null;
    } catch {
      return null;
    }
  }

  deconnecter(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}
