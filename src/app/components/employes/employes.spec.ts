import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
  showFormAdd = false;
  showFormEdit = false;
  showDetailModal = false;
  selectedEmploye: any = null;

  roles = [
    { value: 'TECHNICIEN', label: 'Technicien' },
    { value: 'TECHNICIEN_SUP', label: 'Technicien Supérieur' },
    { value: 'AURELIEN', label: 'Manager Aurelien' },
    { value: 'ODILE', label: 'Manager Odile' },
    { value: 'FERID', label: 'Admin Ferid' },
    { value: 'ESSAN', label: 'Propriétaire Essan' }
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
    salaire: ''
  };

  employeEnEdition = { ...this.nouvelEmploye };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEmployes();
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(
        data => {
          this.employes = data;
          localStorage.setItem('employes', JSON.stringify(data));
        },
        error => {
          // Charger depuis localStorage si l'API échoue
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

    const idIncrement = Math.max(...this.employes.map(e => e.id || 0), 0) + 1;

    const employee = {
      id: idIncrement,
      ...this.nouvelEmploye,
      dateCreation: new Date().toISOString(),
      statut: 'ACTIF'
    };

    this.employes.push(employee);
    localStorage.setItem('employes', JSON.stringify(this.employes));

    // Envoyer à l'API
    this.http.post('http://localhost:8080/api/utilisateurs', employee)
      .subscribe(
        () => {},
        error => console.error('Erreur création', error)
      );

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

    const index = this.employes.findIndex(e => e.id === this.selectedEmploye.id);
    if (index !== -1) {
      this.employes[index] = { ...this.employeEnEdition };
      localStorage.setItem('employes', JSON.stringify(this.employes));

      // Envoyer à l'API
      this.http.put(`http://localhost:8080/api/utilisateurs/${this.selectedEmploye.id}`, this.employeEnEdition)
        .subscribe(
          () => {},
          error => console.error('Erreur modification', error)
        );

      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  supprimerEmploye(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      this.employes = this.employes.filter(e => e.id !== id);
      localStorage.setItem('employes', JSON.stringify(this.employes));

      // Envoyer à l'API
      this.http.delete(`http://localhost:8080/api/utilisateurs/${id}`)
        .subscribe(
          () => {},
          error => console.error('Erreur suppression', error)
        );
    }
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
      salaire: ''
    };
  }

  resetFormEdit() {
    this.employeEnEdition = { ...this.nouvelEmploye };
  }

  getRoleLabel(role: string): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }
}