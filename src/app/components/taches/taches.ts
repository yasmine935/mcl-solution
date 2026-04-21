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
    projet: '', statut: 'En Qualification', date: '',
    priorite: 'Moyenne', fichiers: [] as any[], assignes: [] as any[],
    echeance: '', valeur: 'Bronze', chiffreAffaire: '', numCommande: ''
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

  loadTaches() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        this.taches = data.map(t => this.mapFromBackend(t));
        // Charger les notes depuis localStorage pour chaque tâche
        this.taches.forEach(tache => {
          tache.notes = this.loadNotesForTache(tache.id);
        });
      },
      error: () => {
        const stored = localStorage.getItem('taches');
        this.taches = stored ? JSON.parse(stored) : [];
      }
    });
  }

  // ✅ Notes stockées dans localStorage par tâche
  loadNotesForTache(tacheId: number): any[] {
    const stored = localStorage.getItem(`tache_notes_${tacheId}`);
    return stored ? JSON.parse(stored) : [];
  }

  saveNotesForTache(tacheId: number, notes: any[]) {
    localStorage.setItem(`tache_notes_${tacheId}`, JSON.stringify(notes));
  }

  mapFromBackend(t: any): any {
    const extras = this.loadExtrasForTache(t.id);
    return {
      id: t.id,
      projet: t.titre,
      statut: t.statut === 'A_FAIRE' ? 'En Qualification' :
              t.statut === 'EN_COURS' ? 'En cours' :
              t.statut === 'TERMINEE' ? 'Fait' : t.statut,
      date: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '',
      priorite: t.priorite || extras.priorite || 'Moyenne',
      echeance: t.dateEcheance || extras.echeance || '',
      valeur: extras.valeur || 'Bronze',
      chiffreAffaire: extras.chiffreAffaire || '',
      numCommande: t.description || extras.numCommande || '',
      fichiers: extras.fichiers || [],
      assignes: extras.assignes || [],
      notes: []
    };
  }

  loadExtrasForTache(tacheId: number): any {
    const stored = localStorage.getItem(`tache_extras_${tacheId}`);
    return stored ? JSON.parse(stored) : {};
  }

  saveExtrasForTache(tacheId: number, tache: any) {
    const extras = {
      priorite: tache.priorite,
      echeance: tache.echeance,
      valeur: tache.valeur,
      chiffreAffaire: tache.chiffreAffaire,
      numCommande: tache.numCommande,
      assignes: tache.assignes,
      fichiers: tache.fichiers || []
    };
    localStorage.setItem(`tache_extras_${tacheId}`, JSON.stringify(extras));
  }

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
        ? this.nouvelleTache.echeance : null,
      utilisateur: this.currentUser.id ? { id: this.currentUser.id } : null
    };
    this.http.post<any>(API, body).subscribe({
      next: (tache) => {
        this.saveExtrasForTache(tache.id, this.nouvelleTache);
        const t = this.mapFromBackend(tache);
        t.notes = [];
        this.taches.push(t);
        this.resetFormAdd();
        this.showFormAdd = false;
      },
      error: () => alert('Erreur création projet')
    });
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
    const body = {
      titre: this.tacheEnEdition.projet,
      statut: this.tacheEnEdition.statut === 'En cours' ? 'EN_COURS' :
              this.tacheEnEdition.statut === 'Fait' ? 'TERMINEE' : 'A_FAIRE',
      priorite: this.tacheEnEdition.priorite,
      dateEcheance: this.tacheEnEdition.echeance || null,
      description: this.tacheEnEdition.numCommande
    };
    this.http.put<any>(`${API}/${this.tacheEnEdition.id}`, body).subscribe({
      next: () => {
        this.saveExtrasForTache(this.tacheEnEdition.id, this.tacheEnEdition);
        const index = this.taches.findIndex((t: any) => t.id === this.selectedTache.id);
        if (index !== -1) this.taches[index] = { ...this.tacheEnEdition };
        this.resetFormEdit();
        this.showFormEdit = false;
      },
      error: () => alert('Erreur modification')
    });
  }

  supprimerTache(id: number) {
    if (confirm('Supprimer cette tâche ?')) {
      this.http.delete(`${API}/${id}`).subscribe({
        next: () => {
          this.taches = this.taches.filter((t: any) => t.id !== id);
          localStorage.removeItem(`tache_notes_${id}`);
        },
        error: () => alert('❌ Erreur suppression')
      });
    }
  }

  // ✅ CHAT NOTES
  ouvrirNoteModal(tache: any) {
    this.selectedTache = tache;
    if (!this.selectedTache.notes) {
      this.selectedTache.notes = this.loadNotesForTache(tache.id);
    }
    this.noteTemp = '';
    this.showNoteModal = true;
    // Scroll vers le bas après ouverture
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sauvegarderNote() {
    if (!this.selectedTache || !this.noteTemp.trim()) return;

    const nouvelleNote = {
      auteur: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      auteurId: this.currentUser.id,
      role: this.currentUser.role,
      contenu: this.noteTemp.trim(),
      date: new Date().toLocaleString('fr-FR'),
      timestamp: new Date().getTime()
    };

    if (!this.selectedTache.notes) this.selectedTache.notes = [];
    this.selectedTache.notes.push(nouvelleNote);

    // Sauvegarder dans localStorage
    this.saveNotesForTache(this.selectedTache.id, this.selectedTache.notes);

    this.noteTemp = '';
    setTimeout(() => this.scrollToBottom(), 50);
  }

  // Envoyer avec Entrée (Shift+Entrée pour nouvelle ligne)
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sauvegarderNote();
    }
  }

  scrollToBottom() {
    const container = document.querySelector('.chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  // Est-ce que le message est du user actuel ?
  isMyMessage(note: any): boolean {
    return note.auteurId === this.currentUser.id;
  }

  // Initiales de l'auteur
  getInitiales(auteur: string): string {
    const parts = auteur.split(' ');
    return parts.map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  // Couleur avatar selon rôle
  getAvatarColor(note: any): string {
    const colors: any = {
      'FERID': '#1565c0', 'AURELIEN': '#283593',
      'ODILE': '#0277bd', 'TECHNICIEN_SUP': '#4527a0',
      'TECHNICIEN': '#01579b', 'ESSAN': '#5e35b1'
    };
    return colors[note.role] || '#546e7a';
  }

  fermerNoteModal() { this.showNoteModal = false; this.noteTemp = ''; }

  ouvrirDetailModal(tache: any) {
    this.selectedTache = tache;
    this.showDetailModal = true;
  }

  fermerDetailModal() { this.showDetailModal = false; this.selectedTache = null; }

  resetFormAdd() {
    this.nouvelleTache = {
      projet: '', statut: 'En Qualification', date: '',
      priorite: 'Moyenne', fichiers: [], assignes: [],
      echeance: '', valeur: 'Bronze', chiffreAffaire: '', numCommande: ''
    };
  }

  resetFormEdit() { this.tacheEnEdition = {}; }

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