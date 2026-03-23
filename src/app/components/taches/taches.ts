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
  employes: any[] = [];
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
    fichiers: [] as any[],
    assignes: [] as any[],
    echeance: '',
    valeur: 'Bronze'
  };

  tacheEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTaches();
    this.loadEmployes();
  }

  loadEmployes() {
    const stored = localStorage.getItem('employes');
    this.employes = stored ? JSON.parse(stored) : [];
  }

  loadTaches() {
    const stored = localStorage.getItem('taches');
    this.taches = stored ? JSON.parse(stored) : [
      { id: 1, projet: 'Projet 1', statut: 'En cours', date: '1 oct', priorite: 'Faible', fichiers: [] as any[], assignes: [], echeance: '11 oct', valeur: 'Platinum' },
      { id: 2, projet: 'Projet 2', statut: 'Fait', date: '2 oct', priorite: 'Élevé', fichiers: [] as any[], assignes: [], echeance: '-', valeur: 'Gold' },
      { id: 3, projet: 'Projet 3', statut: 'Perdu', date: '3 oct', priorite: 'Moyenne', fichiers: [] as any[], assignes: [], echeance: '-', valeur: 'Bronze' },
      { id: 4, projet: 'Project4', statut: 'En Attente', date: '16 oct', priorite: 'Faible', fichiers: [] as any[], assignes: [], echeance: '-', valeur: 'Silver' }
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
      fichiers: (this.nouvelleTache.fichiers || []) as any[],
      assignes: (this.nouvelleTache.assignes || []) as any[],
      dateCreation: new Date().toISOString()
    };

    this.taches.push(tache);
    localStorage.setItem('taches', JSON.stringify(this.taches));

    this.resetFormAdd();
    this.showFormAdd = false;
  }

  onFileSelectAdd(event: any) {
    const files = event.target.files;
    if (files) {
      if (!this.nouvelleTache.fichiers) {
        this.nouvelleTache.fichiers = [] as any[];
      }
      for (let i = 0; i < files.length; i++) {
        (this.nouvelleTache.fichiers as any[]).push({
          nom: files[i].name,
          taille: (files[i].size / 1024).toFixed(2),
          date: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  supprimerFichier(index: number) {
    if (this.nouvelleTache.fichiers) {
      this.nouvelleTache.fichiers.splice(index, 1);
    }
  }

  supprimerFichierEdit(index: number) {
    if (this.tacheEnEdition.fichiers) {
      this.tacheEnEdition.fichiers.splice(index, 1);
    }
  }

  onFileSelectEdit(event: any) {
    const files = event.target.files;
    if (files) {
      if (!this.tacheEnEdition.fichiers) {
        this.tacheEnEdition.fichiers = [] as any[];
      }
      for (let i = 0; i < files.length; i++) {
        (this.tacheEnEdition.fichiers as any[]).push({
          nom: files[i].name,
          taille: (files[i].size / 1024).toFixed(2),
          date: new Date().toLocaleString('fr-FR')
        });
      }
    }
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
      fichiers: [] as any[],
      assignes: [] as any[],
      echeance: '',
      valeur: 'Bronze'
    };
  }

  getEmployeeName(employeId: number): string {
    const emp = this.employes.find((e: any) => e.id === employeId);
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
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
    this.noteTemp = tache.noteContent || '';
    this.showNoteModal = true;
  }

  sauvegarderNote() {
    if (this.selectedTache && this.noteTemp.trim()) {
      const currentUser = localStorage.getItem('currentUser') || 'Utilisateur';
      
      if (!this.selectedTache.notes) {
        this.selectedTache.notes = [];
      }

      this.selectedTache.notes.push({
        auteur: currentUser,
        contenu: this.noteTemp,
        date: new Date().toLocaleString('fr-FR')
      });

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