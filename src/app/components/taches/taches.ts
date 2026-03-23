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
  selector: 'app-taches',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './taches.html',
  styleUrl: './taches.css'
})
export class Taches implements OnInit {
  taches: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  showNoteModal = false;
  selectedTache: any = null;
  noteTemp = '';

  statuts = ['En Qualification', 'En cours', 'Fait', 'Perdu', 'En Attente'];
  priorites = ['Faible', 'Élevé', 'Moyenne'];
  valeurs = ['Bronze', 'Platinum', 'Gold', 'Silver'];

  nouvelleTache = {
    projet: '',
    statut: 'En Qualification',
    date: '',
    priorite: 'Moyenne',
    fichiers: '',
    echeance: '',
    valeur: 'Bronze'
  };

  tacheEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTaches();
  }

  loadTaches() {
    const stored = localStorage.getItem('taches');
    this.taches = stored ? JSON.parse(stored) : [
      { id: 1, projet: 'Projet 1', statut: 'En cours', date: '1 oct', priorite: 'Faible', fichiers: 11, echeance: '11 oct', valeur: 'Platinum' },
      { id: 2, projet: 'Projet 2', statut: 'Fait', date: '2 oct', priorite: 'Élevé', fichiers: 0, echeance: '-', valeur: 'Gold' },
      { id: 3, projet: 'Projet 3', statut: 'Perdu', date: '3 oct', priorite: 'Moyenne', fichiers: 0, echeance: '-', valeur: 'Bronze' },
      { id: 4, projet: 'Project4', statut: 'En Attente', date: '16 oct', priorite: 'Faible', fichiers: 0, echeance: '-', valeur: 'Silver' }
    ];
  }

  ajouterTache() {
    if (!this.nouvelleTache.projet) {
      alert('Veuillez remplir le nom du projet');
      return;
    }

    const idIncrement = Math.max(...this.taches.map((t: any) => t.id || 0), 0) + 1;

    const tache = {
      id: idIncrement,
      ...this.nouvelleTache,
      fichiers: 0,
      dateCreation: new Date().toISOString()
    };

    this.taches.push(tache);
    localStorage.setItem('taches', JSON.stringify(this.taches));

    this.resetFormAdd();
    this.showFormAdd = false;
  }

  ouvrirEdition(tache: any) {
    this.tacheEnEdition = { ...tache };
    this.selectedTache = tache;
    this.showFormEdit = true;
  }

  modifierTache() {
    if (!this.tacheEnEdition.projet) {
      alert('Veuillez remplir le nom du projet');
      return;
    }

    const index = this.taches.findIndex((t: any) => t.id === this.selectedTache.id);
    if (index !== -1) {
      this.taches[index] = { ...this.tacheEnEdition };
      localStorage.setItem('taches', JSON.stringify(this.taches));
      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  supprimerTache(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.taches = this.taches.filter((t: any) => t.id !== id);
      localStorage.setItem('taches', JSON.stringify(this.taches));
    }
  }

  resetFormAdd() {
    this.nouvelleTache = {
      projet: '',
      statut: 'En Qualification',
      date: '',
      priorite: 'Moyenne',
      fichiers: '',
      echeance: '',
      valeur: 'Bronze'
    };
  }

  resetFormEdit() {
    this.tacheEnEdition = {};
  }

  getStatutColor(statut: string): string {
    const colors: any = {
      'En Qualification': '#CCCCCC',
      'En cours': '#FFA500',
      'Fait': '#00CC00',
      'Perdu': '#FF0000',
      'En Attente': '#0066FF'
    };
    return colors[statut] || '#CCCCCC';
  }

  getPrioriteColor(priorite: string): string {
    const colors: any = {
      'Faible': '#0066FF',
      'Élevé': '#7700CC',
      'Moyenne': '#0066FF'
    };
    return colors[priorite] || '#0066FF';
  }

  ouvrirNoteModal(tache: any) {
    this.selectedTache = tache;
    this.noteTemp = tache.note || '';
    this.showNoteModal = true;
  }

  sauvegarderNote() {
    if (this.selectedTache) {
      this.selectedTache.note = this.noteTemp;
      localStorage.setItem('taches', JSON.stringify(this.taches));
      this.showNoteModal = false;
      this.noteTemp = '';
    }
  }

  fermerNoteModal() {
    this.showNoteModal = false;
    this.noteTemp = '';
  }
}