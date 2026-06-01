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

const ETAPES_PROJET = [
  'Qualification',
  'Devis',
  'Validation Resp',
  'Bon de commande',
  'Réalisation',
  'Clôture'
];

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
  rechercheTache = '';
  filtreStatutTache = '';
  filtrePrioriteTache = '';
  filtreClientTache = '';
  showFormAdd = false;

  getClientsUniques(): string[] {
    const clients = this.taches.map((t: any) => t.client).filter((c: any) => c && c.trim());
    return [...new Set(clients)].sort();
  }

  tachesFiltrees(): any[] {
    let liste = this.taches;
    if (this.filtreStatutTache) liste = liste.filter((t: any) => t.statut === this.filtreStatutTache);
    if (this.filtrePrioriteTache) liste = liste.filter((t: any) => t.priorite === this.filtrePrioriteTache);
    if (this.filtreClientTache) liste = liste.filter((t: any) => t.client === this.filtreClientTache);
    if (this.rechercheTache.trim()) {
      const q = this.rechercheTache.toLowerCase().trim();
      liste = liste.filter((t: any) =>
        (t.projet || '').toLowerCase().includes(q) ||
        (t.client || '').toLowerCase().includes(q) ||
        (t.numCommande || '').toLowerCase().includes(q) ||
        (t.clientFinal || '').toLowerCase().includes(q)
      );
    }
    return liste;
  }
  showFormEdit = false;
  showNoteModal = false;
  showDetailModal = false;
  selectedTache: any = null;
  noteTemp = '';
  currentUser: any = {};

  statuts = ['En Qualification', 'En cours', 'Fait', 'Perdu', 'En Attente'];
  priorites = ['Faible', 'Élevé', 'Moyenne'];

  clients: any[] = [];

  showAddClientModal = false;
  nouveauClientNom = '';
  clientModalTarget: 'add' | 'edit' = 'add';

  nouvelleTache = {
    projet: '', statut: 'En Qualification', date: '',
    priorite: 'Moyenne', fichiers: [] as any[], assignes: [] as any[],
    echeance: '', client: '', clientFinal: '', chiffreAffaire: '', numCommande: '', numDevis: ''
  };

  tacheEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadClients();
    this.loadEmployes();
    this.loadTaches();
  }

  loadClients() {
    this.http.get<any[]>('http://localhost:8080/api/clients').subscribe({
      next: (data) => this.clients = data,
      error: () => this.clients = []
    });
  }

  onFileSelectCategorie(event: any, form: any, categorie: string) {
    const files = event.target.files;
    if (!files) return;
    if (!form.fichiers) form.fichiers = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        form.fichiers.push({
          nom: file.name,
          type: categorie,
          taille: (file.size / 1024).toFixed(2),
          date: new Date().toLocaleString('fr-FR'),
          dataUrl: e.target.result,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  ouvrirFichier(fichier: any) {
    if (!fichier.dataUrl) return;
    if (fichier.mimeType?.startsWith('image/') || fichier.mimeType === 'application/pdf') {
      window.open(fichier.dataUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = fichier.dataUrl;
      link.download = fichier.nom;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  ouvrirAddClient(target: 'add' | 'edit') {
    this.clientModalTarget = target;
    this.nouveauClientNom = '';
    this.showAddClientModal = true;
  }

  confirmerNouveauClient() {
    const nom = this.nouveauClientNom.trim();
    if (!nom) return;
    if (this.clientModalTarget === 'add') {
      this.nouvelleTache.client = nom;
    } else {
      this.tacheEnEdition.client = nom;
    }
    this.showAddClientModal = false;
    if (!this.clients.some((c: any) => c.nom === nom)) {
      this.http.post<any>('http://localhost:8080/api/clients', { nom, codeClient: '', adresse: '', contact: '', email: '' }).subscribe({
        next: () => this.loadClients(),
        error: () => {}
      });
    }
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => this.employes = data,
      error: () => this.employes = []
    });
  }

  loadTaches() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        this.taches = data.map(t => this.mapFromBackend(t));
        this.taches.forEach(tache => { tache.notes = this.loadNotesForTache(tache.id); });
      },
      error: () => this.taches = []
    });
  }

  loadNotesForTache(tacheId: number): any[] {
    const stored = localStorage.getItem(`tache_notes_${tacheId}`);
    return stored ? JSON.parse(stored) : [];
  }

  saveNotesForTache(tacheId: number, notes: any[]) {
    localStorage.setItem(`tache_notes_${tacheId}`, JSON.stringify(notes));
  }

  parseJsonField(val: any, defaultVal: any): any {
    if (!val) return defaultVal;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return defaultVal; } }
    return val;
  }

  mapFromBackend(t: any): any {
    return {
      id: t.id,
      projet: t.titre,
      statut: t.statut === 'A_FAIRE' ? 'En Qualification' :
              t.statut === 'EN_COURS' ? 'En cours' :
              t.statut === 'TERMINEE' ? 'Fait' : t.statut,
      date: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '',
      priorite: t.priorite || 'Moyenne',
      echeance: t.dateEcheance || '',
      client: t.client || '',
      clientFinal: t.clientFinal || '',
      chiffreAffaire: t.chiffreAffaire || '',
      numCommande: t.description || '',
      numDevis: t.numDevis || '',
      fichiers: this.parseJsonField(t.fichiers, []),
      assignes: this.parseJsonField(t.assignes, []),
      notes: [],
      etapes: this.parseJsonField(t.etapes, ETAPES_PROJET.map(nom => ({ nom, done: false, doneBy: '', doneAt: '' })))
    };
  }

  buildBody(tache: any, statut?: string): any {
    return {
      titre: tache.projet,
      description: tache.numCommande || '',
      priorite: tache.priorite,
      statut: statut || (tache.statut === 'En cours' ? 'EN_COURS' : tache.statut === 'Fait' ? 'TERMINEE' : 'A_FAIRE'),
      dateEcheance: tache.echeance && tache.echeance.match(/^\d{4}-\d{2}-\d{2}$/) ? tache.echeance : null,
      client: tache.client || '',
      clientFinal: tache.clientFinal || '',
      chiffreAffaire: tache.chiffreAffaire || '',
      numDevis: tache.numDevis || '',
      assignes: JSON.stringify(tache.assignes || []),
      etapes: JSON.stringify(tache.etapes || []),
      fichiers: JSON.stringify(tache.fichiers || []),
      utilisateur: this.currentUser.id ? { id: this.currentUser.id } : null
    };
  }

  getAvancement(tache: any): number {
    if (!tache.etapes?.length) return 0;
    const done = tache.etapes.filter((e: any) => e.done).length;
    return Math.round((done / tache.etapes.length) * 100);
  }

  marquerEtape(tache: any, index: number) {
    if (!tache.etapes) return;
    const etape = tache.etapes[index];
    etape.done = !etape.done;
    if (etape.done) {
      etape.doneBy = `${this.currentUser.prenom} ${this.currentUser.nom}`;
      etape.doneAt = new Date().toLocaleString('fr-FR');
    } else {
      etape.doneBy = '';
      etape.doneAt = '';
    }
    this.http.put<any>(`${API}/${tache.id}`, this.buildBody(tache)).subscribe();
  }

  getActiviteRecente(tache: any): any[] {
    if (!tache.etapes) return [];
    return tache.etapes
      .filter((e: any) => e.done && e.doneAt)
      .slice(-3)
      .reverse();
  }

  ajouterTache() {
    if (!this.nouvelleTache.projet) {
      alert('Veuillez remplir le nom du projet');
      return;
    }
    const body = this.buildBody(this.nouvelleTache, 'A_FAIRE');
    body.etapes = JSON.stringify(ETAPES_PROJET.map(nom => ({ nom, done: false, doneBy: '', doneAt: '' })));
    this.http.post<any>(API, body).subscribe({
      next: (created) => {
        const t = this.mapFromBackend({ ...created, ...body });
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
    this.http.put<any>(`${API}/${this.tacheEnEdition.id}`, this.buildBody(this.tacheEnEdition)).subscribe({
      next: () => {
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
        next: () => { this.taches = this.taches.filter((t: any) => t.id !== id); },
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
      echeance: '', client: '', clientFinal: '', chiffreAffaire: '', numCommande: '', numDevis: ''
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
    const colors: any = { 'Faible': '#26a69a', 'Élevé': '#7700CC', 'Moyenne': '#e65100' };
    return colors[priorite] || '#546e7a';
  }

  getEmployeeName(employeId: number): string {
    const emp = this.employes.find((e: any) => e.id === employeId);
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
  }
}