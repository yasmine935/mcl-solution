import { Component, OnInit } from '@angular/core';
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
    // Si l'utilisateur est déjà connecté (localStorage), le rediriger directement
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.role) { this.naviguerVersPage(user); }
      } catch { localStorage.removeItem('user'); }
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
    const opts = { replaceUrl: true }; // remplace /login dans l'historique → le retour ne peut plus y revenir
    switch (user.role) {
      case 'TECHNICIEN':     this.router.navigate(['/dashboard-technicien'], opts); break;
      case 'TECHNICIEN_SUP': this.router.navigate(['/dashboard-kia'], opts); break;
      case 'AURELIEN':       this.router.navigate(['/dashboard-aurelien'], opts); break;
      case 'ODILE':          this.router.navigate(['/dashboard-odile'], opts); break;
      case 'FERID':          this.router.navigate(['/dashboard-admin'], opts); break;
      case 'ESSAN':          this.router.navigate(['/dashboard-essan'], opts); break;
      case 'KARINE':         this.router.navigate(['/dashboard-karine'], opts); break;
      case 'HAIDEH':         this.router.navigate(['/dashboard-haideh'], opts); break;
      case 'NACCERA':        this.router.navigate(['/dashboard-naccera'], opts); break;
      case 'ABY':            this.router.navigate(['/dashboard-aby'], opts); break;
      case 'UN':             this.router.navigate(['/dashboard-technicien'], opts); break;
      default:               this.router.navigate(['/login'], opts);
    }
  }

  login() {
    this.http.post<any>('http://localhost:8080/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        const pwdChangedKey = `pwd_changed_${user.username}`;
        const alreadyChanged = localStorage.getItem(pwdChangedKey) === 'true';
        if (user.premierConnexion && !alreadyChanged) {
          // Première connexion sur cet appareil → forcer changement de mot de passe
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
        this.pendingUser.premierConnexion = false;
        localStorage.setItem('user', JSON.stringify(this.pendingUser));
        localStorage.setItem(`pwd_changed_${this.pendingUser.username}`, 'true');
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