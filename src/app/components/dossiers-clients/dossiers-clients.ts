import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UtilisateursApi } from '../../services/api/apis';

/**
 * Gestion des comptes CLIENT (accès externe au portail de ticketing) — distincte
 * de la gestion des employés (voir composant Employes) : un compte client n'est
 * pas un employé, mais les deux partagent la même table `utilisateurs` et le même
 * endpoint backend /api/utilisateurs (@PreAuthorize ADMINISTRATEUR/RH/MANAGER),
 * d'où le tri par rôle fait ici plutôt que côté API.
 */
@Component({
  selector: 'app-dossiers-clients',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './dossiers-clients.html',
  styleUrl: './dossiers-clients.css'
})
export class DossiersClients implements OnInit {
  clients: any[] = [];
  canAdd = false;
  showFormAdd = false;
  showFormEdit = false;
  showDetailModal = false;
  selectedClient: any = null;
  showInactifs = false;
  currentUser: any = {};

  // Rôles autorisés à créer/gérer des comptes, alignés sur le backend
  // (@PreAuthorize("hasAnyAuthority('ADMINISTRATEUR', 'RH', 'MANAGER')") sur UtilisateurController).
  private readonly rolesGestionComptes = ['RH', 'ADMINISTRATEUR', 'MANAGER'];

  nouveauClient = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    username: '',
    password: ''
  };

  clientEnEdition: any = {};

  constructor(private utilisateursApi: UtilisateursApi) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.canAdd = this.rolesGestionComptes.includes((this.currentUser.role || '').toUpperCase());
    this.loadClients();
  }

  loadClients() {
    this.utilisateursApi.lister<any>()
      .subscribe(
        (data: any[]) => {
          this.clients = data.filter((u: any) => (u.role || '').toUpperCase() === 'CLIENT');
          localStorage.setItem('dossiers_clients', JSON.stringify(this.clients));
        },
        () => {
          const stored = localStorage.getItem('dossiers_clients');
          this.clients = stored ? JSON.parse(stored) : [];
        }
      );
  }

  ajouterClient() {
    if (!this.nouveauClient.prenom || !this.nouveauClient.nom || !this.nouveauClient.email
        || !this.nouveauClient.username || !this.nouveauClient.password) {
      alert('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email, Identifiant, Mot de passe)');
      return;
    }

    const payload = {
      prenom: this.nouveauClient.prenom,
      nom: this.nouveauClient.nom,
      email: this.nouveauClient.email,
      telephone: this.nouveauClient.telephone,
      username: this.nouveauClient.username,
      password: this.nouveauClient.password,
      role: 'CLIENT',
      statut: 'ACTIF'
    };

    this.utilisateursApi.creer<any>(payload)
      .subscribe({
        next: (created: any) => {
          this.clients.push(created);
          localStorage.setItem('dossiers_clients', JSON.stringify(this.clients));
        },
        error: (err: any) => console.error('Erreur création compte client', err)
      });

    this.resetFormAdd();
    this.showFormAdd = false;
  }

  ouvrirEdition(client: any) {
    this.clientEnEdition = { ...client };
    this.selectedClient = client;
    this.showFormEdit = true;
  }

  modifierClient() {
    if (!this.clientEnEdition.prenom || !this.clientEnEdition.nom || !this.clientEnEdition.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const index = this.clients.findIndex((c: any) => c.id === this.selectedClient.id);
    if (index !== -1) {
      this.clients[index] = { ...this.clientEnEdition };
      localStorage.setItem('dossiers_clients', JSON.stringify(this.clients));

      this.utilisateursApi.modifier(this.selectedClient.id, { ...this.clientEnEdition, role: 'CLIENT' })
        .subscribe(
          () => {},
          (error: any) => console.error('Erreur modification', error)
        );

      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  get countInactifs(): number {
    return this.clients.filter((c: any) => c.actif === false).length;
  }

  clients_filtres(): any[] {
    return this.showInactifs
      ? this.clients
      : this.clients.filter((c: any) => c.actif !== false);
  }

  desactiverClient(id: number, nomClient: string) {
    const nomUser = `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || 'Admin';
    if (confirm(`Désactiver le compte client "${nomClient}" ? Il perdra l'accès au portail.`)) {
      this.utilisateursApi.desactiver(id, nomUser).subscribe({
        next: () => { this.loadClients(); this.showDetailModal = false; },
        error: () => alert('Erreur lors de la désactivation')
      });
    }
  }

  reactiverClient(id: number) {
    this.utilisateursApi.reactiver(id).subscribe({
      next: () => this.loadClients(),
      error: () => alert('Erreur lors de la réactivation')
    });
  }

  ouvrirDetailModal(client: any) {
    this.selectedClient = client;
    this.showDetailModal = true;
  }

  fermerDetailModal() {
    this.showDetailModal = false;
    this.selectedClient = null;
  }

  resetFormAdd() {
    this.nouveauClient = { prenom: '', nom: '', email: '', telephone: '', username: '', password: '' };
  }

  resetFormEdit() {
    this.clientEnEdition = {};
  }
}
