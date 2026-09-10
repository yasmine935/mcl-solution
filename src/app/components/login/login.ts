import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { dashboardPourRole } from '../../services/role-routes';
import { Auth } from '../../services/auth';

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

  constructor(private readonly auth: Auth, private readonly router: Router) {}

  ngOnInit() {
    // Si l'utilisateur est déjà connecté (user + jeton), le rediriger directement
    const user = this.auth.utilisateurCourant();
    if (user?.role) {
      this.naviguerVersPage(user);
    } else {
      // Session absente ou incomplète (modale de changement abandonnée) : purge
      this.auth.deconnecter();
    }
  }

  ouvrirForgot() { this.showForgotModal = true; this.forgotUsername = ''; this.forgotMessage = ''; this.forgotError = ''; }
  fermerForgot() { this.showForgotModal = false; }

  envoyerDemande() {
    if (!this.forgotUsername.trim()) { this.forgotError = 'Entrez votre nom d\'utilisateur'; return; }
    this.forgotLoading = true;
    this.forgotError = '';
    this.auth.forgotPassword(this.forgotUsername).subscribe({
      next: () => { this.forgotLoading = false; this.forgotMessage = 'Demande envoyée ! L\'admin va réinitialiser votre mot de passe.'; },
      error: (e) => { this.forgotLoading = false; this.forgotError = e.status === 400 ? 'Nom d\'utilisateur introuvable.' : 'Erreur serveur, réessayez.'; }
    });
  }

  private naviguerVersPage(user: any) {
    // replaceUrl : remplace /login dans l'historique → le retour ne peut plus y revenir
    this.router.navigate([dashboardPourRole(user?.role)], { replaceUrl: true });
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        if (res.user.premierConnexion) {
          // Mot de passe temporaire → ne rien persister tant qu'il n'est pas changé
          // (sinon un rechargement de page permettrait de sauter cette étape)
          this.pendingUser = res.user;
          this.newPassword = '';
          this.confirmPassword = '';
          this.changePasswordError = '';
          this.changePasswordSuccess = false;
          this.showChangePasswordModal = true;
        } else {
          this.auth.persisterSession(res.user);
          this.naviguerVersPage(res.user);
        }
      },
      error: () => {
        this.errorMessage = 'Username ou mot de passe incorrect !';
      }
    });
  }

  confirmerNouveauMotDePasse() {
    this.changePasswordError = '';
    if (!this.newPassword || this.newPassword.length < 8) {
      this.changePasswordError = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changePasswordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.changePasswordLoading = true;
    // Le backend exige le mot de passe actuel (celui utilisé pour se connecter)
    this.auth.changePassword(this.password, this.newPassword).subscribe({
      next: () => {
        this.changePasswordLoading = false;
        this.changePasswordSuccess = true;
        this.pendingUser.premierConnexion = false;
        this.auth.persisterSession(this.pendingUser);
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
