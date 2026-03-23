import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-fiche-intervention-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule
  ],
  templateUrl: './fiche-intervention-manager.html',
  styleUrl: './fiche-intervention-manager.css'
})
export class FicheInterventionManager implements OnInit {
  user: any = {};
  showCreateFiche = false;
  showDetailModal = false;
  showCompletedTab = false;
  fiches: any[] = [];
  techniciensDisponibles: any[] = [];
  selectedFiche: any = null;

  nouveauFiche = {
    numero: '',
    client: '',
    description: '',
    date: '',
    technicienId: null,
    technicienNom: ''
  };

  // Documents/Fonctionnalités dynamiques
  documents: any[] = [
    { id: 1, nom: 'Plan de Prévention', checked: false },
    { id: 2, nom: 'Fiche de Sécurité', checked: false },
    { id: 3, nom: 'Doc PdP', checked: false },
    { id: 4, nom: 'Doc FdS', checked: false }
  ];

  // Tâches dynamiques
  taches: any[] = [
    { id: 1, nom: 'Installation des caméras', checked: false },
    { id: 2, nom: 'Mise en place support mural', checked: false },
    { id: 3, nom: 'Fixation TV 65" sur Support', checked: false },
    { id: 4, nom: 'Connectique et Paramétrage', checked: false },
    { id: 5, nom: 'Test et Validation', checked: false }
  ];

  // Champs de saisie libres
  champsLibres: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadFiches();
    this.loadTechniciens();
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
  }

  loadTechniciens() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => {
        this.techniciensDisponibles = data.filter((u: any) =>
          u.role === 'TECHNICIEN' || u.role === 'TECHNICIEN_SUP'
        );
      }, error => console.error('Erreur chargement techniciens', error));
  }

  // AJOUTER un document/fonctionnalité
  ajouterDocument() {
    const newId = Math.max(...this.documents.map(d => d.id || 0), 0) + 1;
    this.documents.push({
      id: newId,
      nom: '',
      checked: false
    });
  }

  // SUPPRIMER un document
  supprimerDocument(index: number) {
    this.documents.splice(index, 1);
  }

  // AJOUTER une tâche
  ajouterTache() {
    const newId = Math.max(...this.taches.map(t => t.id || 0), 0) + 1;
    this.taches.push({
      id: newId,
      nom: '',
      checked: false
    });
  }

  // SUPPRIMER une tâche
  supprimerTache(index: number) {
    this.taches.splice(index, 1);
  }

  // AJOUTER un champ libre
  ajouterChampLibre() {
    this.champsLibres.push({
      id: Math.random(),
      label: '',
      valeur: ''
    });
  }

  // SUPPRIMER un champ libre
  supprimerChampLibre(index: number) {
    this.champsLibres.splice(index, 1);
  }

  creerFiche() {
    if (!this.nouveauFiche.numero || !this.nouveauFiche.client || !this.nouveauFiche.technicienId) {
      alert('Veuillez remplir : Numéro, Client et Technicien');
      return;
    }

    const idIncrement = Math.max(...this.fiches.map(f => f.id || 0), 0) + 1;

    // Récupérer les documents cochés
    const docsCoches = this.documents.filter(d => d.checked && d.nom).map(d => d.nom);
    
    // Récupérer les tâches cochées
    const tachesCoches = this.taches.filter(t => t.checked && t.nom).map(t => t.nom);

    const nouvelleFiche = {
      id: idIncrement,
      numero: this.nouveauFiche.numero,
      client: this.nouveauFiche.client,
      description: this.nouveauFiche.description,
      date: this.nouveauFiche.date,
      technicienId: this.nouveauFiche.technicienId,
      technicienNom: this.nouveauFiche.technicienNom,
      statut: 'EN_COURS',
      documents: docsCoches,
      taches: tachesCoches,
      champsLibres: this.champsLibres,
      dateCreation: new Date().toISOString()
    };

    this.fiches.push(nouvelleFiche);
    localStorage.setItem('interventions', JSON.stringify(this.fiches));

    // Reset formulaire
    this.resetFormulaire();
    this.showCreateFiche = false;
  }

  resetFormulaire() {
    this.nouveauFiche = { numero: '', client: '', description: '', date: '', technicienId: null, technicienNom: '' };
    
    this.documents = [
      { id: 1, nom: 'Plan de Prévention', checked: false },
      { id: 2, nom: 'Fiche de Sécurité', checked: false },
      { id: 3, nom: 'Doc PdP', checked: false },
      { id: 4, nom: 'Doc FdS', checked: false }
    ];

    this.taches = [
      { id: 1, nom: 'Installation des caméras', checked: false },
      { id: 2, nom: 'Mise en place support mural', checked: false },
      { id: 3, nom: 'Fixation TV 65" sur Support', checked: false },
      { id: 4, nom: 'Connectique et Paramétrage', checked: false },
      { id: 5, nom: 'Test et Validation', checked: false }
    ];

    this.champsLibres = [];
  }

  onTechnicienChange() {
    const tech = this.techniciensDisponibles.find(t => t.id === this.nouveauFiche.technicienId);
    if (tech) {
      this.nouveauFiche.technicienNom = `${tech.prenom} ${tech.nom}`;
    }
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showDetailModal = true;
  }

  fermerDetailFiche() {
    this.showDetailModal = false;
    this.selectedFiche = null;
  }
}