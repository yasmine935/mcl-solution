import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
export class Login {
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

  constructor(private http: HttpClient, private router: Router) {}

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
    switch (user.role) {
      case 'TECHNICIEN':     this.router.navigate(['/dashboard-technicien']); break;
      case 'TECHNICIEN_SUP': this.router.navigate(['/dashboard-kia']); break;
      case 'AURELIEN':       this.router.navigate(['/dashboard-aurelien']); break;
      case 'ODILE':          this.router.navigate(['/dashboard-odile']); break;
      case 'FERID':          this.router.navigate(['/dashboard-admin']); break;
      case 'ESSAN':          this.router.navigate(['/dashboard-essan']); break;
      case 'KARINE':         this.router.navigate(['/dashboard-karine']); break;
      case 'AYDEH':          this.router.navigate(['/dashboard-aydeh']); break;
      case 'NACCERA':        this.router.navigate(['/dashboard-naccera']); break;
      case 'ABY':            this.router.navigate(['/dashboard-aby']); break;
      case 'UN':             this.router.navigate(['/dashboard-technicien']); break;
      default:               this.router.navigate(['/login']);
    }
  }

  login() {
    this.http.post<any>('http://localhost:8080/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.premierConnexion) {
          // Première connexion → forcer changement de mot de passe
          this.pendingUser = user;
          this.newPassword = '';
          this.confirmPassword = '';
          this.changePasswordError = '';
          this.changePasswordSuccess = false;
          this.showChangePasswordModal = true;
        } else {
          this.naviguerVersPage(user);
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
      { username: this.pendingUser.username, newPassword: this.newPassword },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.changePasswordLoading = false;
        this.changePasswordSuccess = true;
        // Mettre à jour le user en localStorage
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