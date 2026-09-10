import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UtilisateursApi } from '../../services/api/apis';

@Component({
 selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './employes.html',
  styleUrl: './employes.css'
})
export class Employes implements OnInit {
  employes: any[] = [];
  canAdd = false;
  showFormAdd = false;
  showFormEdit = false;
  showDetailModal = false;
  selectedEmploye: any = null;
  showInactifs = false;
  currentUser: any = {};

  roles = [
    { value: 'TECHNICIEN', label: 'Technicien' },
    { value: 'TECHNICIEN_SUP', label: 'Technicien Supérieur' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMINISTRATEUR', label: 'Administrateur' },
    { value: 'DIRECTION', label: 'Direction' },
    { value: 'RH', label: 'Ressources Humaines' },
    { value: 'COMPTABILITE', label: 'Comptabilité' },
    { value: 'SUPPLY_CHAIN', label: 'Supply Chain' },
    { value: 'ADMINISTRATIF', label: 'Direction Administrative' }
  ];

  departements = [
    'Maintenance',
    'Électricité',
    'Plomberie',
    'Climatisation',
    'Administration',
    'Ressources Humaines',
    'Finances'
  ];

  nouvelEmploye = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    role: '',
    dateEmbauche: '',
    salaire: '',
    username: '',
    password: ''
  };

  employeEnEdition: any = {};

  constructor(private utilisateursApi: UtilisateursApi) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.canAdd = (this.currentUser.role || '').toUpperCase() === 'RH';
    this.loadEmployes();
  }

  loadEmployes() {
    this.utilisateursApi.lister<any>()
      .subscribe(
        (data: any[]) => {
          this.employes = data;
          localStorage.setItem('employes', JSON.stringify(data));
        },
        (error: any) => {
          const stored = localStorage.getItem('employes');
          this.employes = stored ? JSON.parse(stored) : [];
        }
      );
  }

  ajouterEmploye() {
    if (!this.nouvelEmploye.prenom || !this.nouvelEmploye.nom || !this.nouvelEmploye.email) {
      alert('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email)');
      return;
    }

    // Payload envoyé au backend (sans id — généré par la DB)
    const payload = {
      prenom: this.nouvelEmploye.prenom,
      nom: this.nouvelEmploye.nom,
      email: this.nouvelEmploye.email,
      telephone: this.nouvelEmploye.telephone,
      poste: this.nouvelEmploye.poste,
      departement: this.nouvelEmploye.departement,
      role: this.nouvelEmploye.role,
      dateEmbauche: this.nouvelEmploye.dateEmbauche,
      salaire: this.nouvelEmploye.salaire,
      username: this.nouvelEmploye.username,
      password: this.nouvelEmploye.password,
      statut: 'ACTIF'
    };

    this.utilisateursApi.creer<any>(payload)
      .subscribe({
        next: (created: any) => {
          this.employes.push(created);
          localStorage.setItem('employes', JSON.stringify(this.employes));
        },
        error: (err: any) => console.error('Erreur création', err)
      });

    this.resetFormAdd();
    this.showFormAdd = false;
  }

  ouvrirEdition(employe: any) {
    this.employeEnEdition = { ...employe };
    this.selectedEmploye = employe;
    this.showFormEdit = true;
  }

  modifierEmploye() {
    if (!this.employeEnEdition.prenom || !this.employeEnEdition.nom || !this.employeEnEdition.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const index = this.employes.findIndex((e: any) => e.id === this.selectedEmploye.id);
    if (index !== -1) {
      this.employes[index] = { ...this.employeEnEdition };
      localStorage.setItem('employes', JSON.stringify(this.employes));

      this.utilisateursApi.modifier(this.selectedEmploye.id, this.employeEnEdition)
        .subscribe(
          () => {},
          (error: any) => console.error('Erreur modification', error)
        );

      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  get countInactifs(): number {
    return this.employes.filter((e: any) => e.actif === false).length;
  }

  employes_filtres(): any[] {
    return this.showInactifs
      ? this.employes
      : this.employes.filter((e: any) => e.actif !== false);
  }

  desactiverEmploye(id: number, nomEmploye: string) {
    const nomUser = `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || 'Admin';
    if (confirm(`Désactiver l'employé "${nomEmploye}" ? Il restera dans l'historique.`)) {
      this.utilisateursApi.desactiver(id, nomUser).subscribe({
        next: () => { this.loadEmployes(); this.showDetailModal = false; },
        error: () => alert('Erreur lors de la désactivation')
      });
    }
  }

  reactiverEmploye(id: number) {
    this.utilisateursApi.reactiver(id).subscribe({
      next: () => this.loadEmployes(),
      error: () => alert('Erreur lors de la réactivation')
    });
  }

  ouvrirDetailModal(employe: any) {
    this.selectedEmploye = employe;
    this.showDetailModal = true;
  }

  fermerDetailModal() {
    this.showDetailModal = false;
    this.selectedEmploye = null;
  }

  resetFormAdd() {
    this.nouvelEmploye = {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      poste: '',
      departement: '',
      role: '',
      dateEmbauche: '',
      salaire: '',
      username: '',
      password: ''
    };
  }

  resetFormEdit() {
    this.employeEnEdition = { ...this.nouvelEmploye };
  }

  getRoleLabel(role: string): string {
    const found = this.roles.find((r: any) => r.value === role);
    return found ? found.label : role;
  }
}