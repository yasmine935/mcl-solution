import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { dashboardPourRole } from '../../services/role-routes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  username = '';
  password = '';
  errorMessage = '';

  // Mot de passe oublié
  showForgotModal = false;
  forgotUsername = '';
  forgotMessage = '';
  forgotError = '';
  forgotLoading = false;

  // Premier connexion — changer mot de passe
  showChangePasswordModal = false;
  pendingUser: any = null;
  newPassword = '';
  confirmPassword = '';
  changePasswordError = '';
  changePasswordLoading = false;
  changePasswordSuccess = false;

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    // Si l'utilisateur est déjà connecté (user + jeton), le rediriger directement
    const stored = localStorage.getItem('user');
    if (stored && localStorage.getItem('token')) {
      try {
        const user = JSON.parse(stored);
        if (user?.role) { this.naviguerVersPage(user); }
      } catch { localStorage.removeItem('user'); localStorage.removeItem('token'); }
    } else {
      // Session incomplète (user sans jeton, ou modale de changement abandonnée) : purge
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  ouvrirForgot() { this.showForgotModal = true; this.forgotUsername = ''; this.forgotMessage = ''; this.forgotError = ''; }
  fermerForgot() { this.showForgotModal = false; }

  envoyerDemande() {
    if (!this.forgotUsername.trim()) { this.forgotError = 'Entrez votre nom d\'utilisateur'; return; }
    this.forgotLoading = true;
    this.forgotError = '';
    this.http.post('http://localhost:8080/api/auth/forgot-password', { username: this.forgotUsername }, { responseType: 'text' }).subscribe({
      next: () => { this.forgotLoading = false; this.forgotMessage = 'Demande envoyée ! L\'admin va réinitialiser votre mot de passe.'; },
      error: (e) => { this.forgotLoading = false; this.forgotError = e.status === 400 ? 'Nom d\'utilisateur introuvable.' : 'Erreur serveur, réessayez.'; }
    });
  }

  private naviguerVersPage(user: any) {
    // replaceUrl : remplace /login dans l'historique → le retour ne peut plus y revenir
    this.router.navigate([dashboardPourRole(user?.role)], { replaceUrl: true });
  }

  login() {
    this.http.post<any>('http://localhost:8080/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        // Ne jamais persister le mot de passe côté navigateur
        const { password: _pwd, ...safeUser } = res.user;
        localStorage.setItem('token', res.token);
        if (safeUser.premierConnexion) {
          // Mot de passe temporaire → ne rien persister tant qu'il n'est pas changé
          // (sinon un rechargement de page permettrait de sauter cette étape)
          this.pendingUser = safeUser;
          this.newPassword = '';
          this.confirmPassword = '';
          this.changePasswordError = '';
          this.changePasswordSuccess = false;
          this.showChangePasswordModal = true;
        } else {
          localStorage.setItem('user', JSON.stringify(safeUser));
          this.naviguerVersPage(safeUser);
        }
      },
      error: () => {
        this.errorMessage = 'Username ou mot de passe incorrect !';
      }
    });
  }

  confirmerNouveauMotDePasse() {
    this.changePasswordError = '';
    if (!this.newPassword || this.newPassword.length < 4) {
      this.changePasswordError = 'Le mot de passe doit contenir au moins 4 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changePasswordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.changePasswordLoading = true;
    this.http.put('http://localhost:8080/api/auth/change-password',
      // Le backend exige désormais le mot de passe actuel (celui utilisé pour se connecter)
      { username: this.pendingUser.username, currentPassword: this.password, newPassword: this.newPassword },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.changePasswordLoading = false;
        this.changePasswordSuccess = true;
        this.pendingUser.premierConnexion = false;
        localStorage.setItem('user', JSON.stringify(this.pendingUser));
        setTimeout(() => {
          this.showChangePasswordModal = false;
          this.naviguerVersPage(this.pendingUser);
        }, 1500);
      },
      error: () => {
        this.changePasswordLoading = false;
        this.changePasswordError = 'Erreur lors du changement. Réessayez.';
      }
    });
  }
}