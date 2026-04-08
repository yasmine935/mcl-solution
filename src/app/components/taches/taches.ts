import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

const API = 'http://localhost:8080/api/taches';

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
  showDetailModal = false;
  selectedTache: any = null;
  noteTemp = '';
  currentUser: any = {};

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
    valeur: 'Bronze',
    chiffreAffaire: '',
    numCommande: ''
  };

  tacheEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadEmployes();
    this.loadTaches();
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => this.employes = data,
      error: () => {
        const stored = localStorage.getItem('employes');
        this.employes = stored ? JSON.parse(stored) : [];
      }
    });
  }

  // ✅ GET depuis backend
  loadTaches() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => this.taches = data,
      error: () => {
        const stored = localStorage.getItem('taches');
        this.taches = stored ? JSON.parse(stored) : [];
      }
    });
  }

  // ✅ POST vers backend
  ajouterTache() {
    if (!this.nouvelleTache.projet) {
      alert('Veuillez remplir le nom du projet');
      return;
    }

  const body = {
  titre: this.nouvelleTache.projet,
  description: this.nouvelleTache.numCommande,
  priorite: this.nouvelleTache.priorite,
  statut: 'A_FAIRE',
  dateEcheance: this.nouvelleTache.echeance && this.nouvelleTache.echeance.match(/^\d{4}-\d{2}-\d{2}$/) 
    ? this.nouvelleTache.echeance 
    : null,
  utilisateur: this.currentUser.id ? { id: this.currentUser.id } : null
};

    this.http.post<any>(API, body).subscribe({
      next: (tache) => {
        this.taches.push(this.mapFromBackend(tache));
        this.resetFormAdd();
        this.showFormAdd = false;
      },
      error: () => alert('❌ Erreur création tâche')
    });
  }

  mapFromBackend(t: any): any {
    return {
      id: t.id,
      projet: t.titre,
      statut: t.statut === 'A_FAIRE' ? 'En Qualification' :
              t.statut === 'EN_COURS' ? 'En cours' :
              t.statut === 'TERMINEE' ? 'Fait' : t.statut,
      date: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '',
      priorite: t.priorite,
      echeance: t.dateEcheance || '-',
      valeur: 'Bronze',
      chiffreAffaire: '',
      numCommande: t.description || '',
      fichiers: [],
      assignes: [],
      notes: []
    };
  }

  ouvrirEdition(tache: any) {
    this.tacheEnEdition = { ...tache };
    this.selectedTache = tache;
    this.showFormEdit = true;
  }

  // ✅ PUT vers backend
  modifierTache() {
    if (!this.tacheEnEdition.projet) {
      alert('Veuillez remplir le nom du projet');
      return;
    }

    const body = {
      titre: this.tacheEnEdition.projet,
      statut: this.tacheEnEdition.statut === 'En cours' ? 'EN_COURS' :
              this.tacheEnEdition.statut === 'Fait' ? 'TERMINEE' : 'A_FAIRE',
      priorite: this.tacheEnEdition.priorite
    };

    this.http.put<any>(`${API}/${this.tacheEnEdition.id}`, body).subscribe({
      next: () => {
        const index = this.taches.findIndex((t: any) => t.id === this.selectedTache.id);
        if (index !== -1) this.taches[index] = { ...this.tacheEnEdition };
        this.resetFormEdit();
        this.showFormEdit = false;
      },
      error: () => alert('❌ Erreur modification')
    });
  }

  // ✅ DELETE vers backend
  supprimerTache(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.http.delete(`${API}/${id}`).subscribe({
        next: () => this.taches = this.taches.filter((t: any) => t.id !== id),
        error: () => alert('❌ Erreur suppression')
      });
    }
  }

  ouvrirDetailModal(tache: any) {
    this.selectedTache = tache;
    this.showDetailModal = true;
  }

  fermerDetailModal() {
    this.showDetailModal = false;
    this.selectedTache = null;
  }

  resetFormAdd() {
    this.nouvelleTache = {
      projet: '', statut: 'En Qualification', date: '',
      priorite: 'Moyenne', fichiers: [], assignes: [],
      echeance: '', valeur: 'Bronze', chiffreAffaire: '', numCommande: ''
    };
  }

  resetFormEdit() { this.tacheEnEdition = {}; }

  ouvrirNoteModal(tache: any) {
    this.selectedTache = tache;
    this.noteTemp = '';
    this.showNoteModal = true;
  }

  sauvegarderNote() {
    if (this.selectedTache && this.noteTemp.trim()) {
      if (!this.selectedTache.notes) this.selectedTache.notes = [];
      this.selectedTache.notes.push({
        auteur: `${this.currentUser.prenom} ${this.currentUser.nom}`,
        contenu: this.noteTemp,
        date: new Date().toLocaleString('fr-FR')
      });
      this.showNoteModal = false;
      this.noteTemp = '';
    }
  }

  fermerNoteModal() { this.showNoteModal = false; this.noteTemp = ''; }

  onFileSelectAdd(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.nouvelleTache.fichiers.push({
          nom: files[i].name,
          taille: (files[i].size / 1024).toFixed(2),
          date: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  supprimerFichier(index: number) { this.nouvelleTache.fichiers.splice(index, 1); }
  supprimerFichierEdit(index: number) { this.tacheEnEdition.fichiers?.splice(index, 1); }

  onFileSelectEdit(event: any) {
    const files = event.target.files;
    if (files) {
      if (!this.tacheEnEdition.fichiers) this.tacheEnEdition.fichiers = [];
      for (let i = 0; i < files.length; i++) {
        this.tacheEnEdition.fichiers.push({
          nom: files[i].name,
          taille: (files[i].size / 1024).toFixed(2),
          date: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  getStatutColor(statut: string): string {
    const colors: any = {
      'En Qualification': '#CCCCCC', 'En cours': '#FFA500',
      'Fait': '#00CC00', 'Perdu': '#FF0000', 'En Attente': '#0066FF'
    };
    return colors[statut] || '#CCCCCC';
  }

  getPrioriteColor(priorite: string): string {
    const colors: any = { 'Faible': '#0066FF', 'Élevé': '#7700CC', 'Moyenne': '#0066FF' };
    return colors[priorite] || '#0066FF';
  }

  getValeurColor(valeur: string): string {
    const colors: any = {
      'Bronze': '#CD7F32', 'Platinum': '#E5E4E2', 'Gold': '#FFD700', 'Silver': '#C0C0C0'
    };
    return colors[valeur] || '#CCCCCC';
  }

  getEmployeeName(employeId: number): string {
    const emp = this.employes.find((e: any) => e.id === employeId);
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
  }
}