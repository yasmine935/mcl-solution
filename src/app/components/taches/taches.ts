import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ClientsApi, TachesApi, UtilisateursApi } from '../../services/api/apis';

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
  @Input() modeConsultation = false;
  taches: any[] = [];
  employes: any[] = [];
  rechercheTache = '';
  filtreStatutTache = '';
  filtrePrioriteTache = '';
  filtreClientTache = '';
  showFormAdd = false;

  // ── Pagination serveur (20 projets par page, plus de findAll() complet) ──
  pageActuelle = 0;
  taillePage = 20;
  totalElements = 0;
  totalPages = 0;
  chargementTaches = false;
  private rechercheTimeout: any = null;

  /** Clients disponibles pour le filtre — dérivé de la liste complète des clients,
   * pas des projets déjà chargés (qui ne représentent qu'une seule page). */
  getClientsUniques(): string[] {
    return [...new Set(this.clients.map((c: any) => c.nom).filter((n: any) => n && n.trim()))].sort();
  }

  /** Le filtrage/tri se fait désormais côté serveur (voir chargerPage) —
   * cette méthode ne fait plus que renvoyer la page courante déjà filtrée.
   * Conservée telle quelle pour ne pas toucher tous les appels du template. */
  tachesFiltrees(): any[] {
    return this.taches;
  }

  /** Déclenché par les filtres statut/priorité/client : recharge depuis la page 0. */
  onFiltreChange() {
    this.pageActuelle = 0;
    this.chargerPage();
  }

  /** Recherche texte : léger debounce pour ne pas requêter à chaque frappe. */
  onRechercheChange() {
    if (this.rechercheTimeout) clearTimeout(this.rechercheTimeout);
    this.rechercheTimeout = setTimeout(() => {
      this.pageActuelle = 0;
      this.chargerPage();
    }, 350);
  }

  reinitialiserFiltres() {
    this.rechercheTache = '';
    this.filtreStatutTache = '';
    this.filtrePrioriteTache = '';
    this.filtreClientTache = '';
    this.pageActuelle = 0;
    this.chargerPage();
  }

  pagePrecedente() {
    if (this.pageActuelle > 0) { this.pageActuelle--; this.chargerPage(); this.scrollListeEnHaut(); }
  }

  pageSuivante() {
    if (this.pageActuelle < this.totalPages - 1) { this.pageActuelle++; this.chargerPage(); this.scrollListeEnHaut(); }
  }

  /** Remonte en haut de la page — utilisé après un changement de page, ou en
   * sortant d'un formulaire (ajout/édition) qui masque la liste et qui a pu être
   * scrollé plus bas (ex: pour atteindre le bouton Enregistrer/Annuler). */
  scrollListeEnHaut() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  showFormEdit = false;
  showNoteModal = false;
  showDetailModal = false;
  selectedTache: any = null;
  noteTemp = '';
  currentUser: any = {};

  statuts = ['Qualification', 'Devis', 'Commande', 'En cours', 'Réalisé', 'Perdu'];
  priorites = ['Faible', 'Élevé', 'Moyenne'];

  clients: any[] = [];

  showAddClientModal = false;
  nouveauClientNom = '';
  clientModalTarget: 'add' | 'edit' = 'add';

  nouvelleTache = {
    projet: '', statut: 'Qualification', date: new Date().toLocaleDateString('fr-FR'),
    priorite: 'Moyenne', fichiers: [] as any[], assignes: [] as any[],
    echeance: '', client: '', clientFinal: '', adresse: '', chiffreAffaire: '', numCommande: '', numDevis: '', caDevis: ''
  };

  tacheEnEdition: any = {};

  constructor(
    private tachesApi: TachesApi,
    private clientsApi: ClientsApi,
    private utilisateursApi: UtilisateursApi
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadClients();
    this.loadEmployes();
    this.chargerPage();
  }

  loadClients() {
    this.clientsApi.lister<any>().subscribe({
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
    const arr = fichier.dataUrl.split(',');
    const mime = (arr[0].match(/:(.*?);/) || [])[1] || fichier.mimeType || 'application/octet-stream';
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (const [i, ch] of [...bstr].entries()) u8arr[i] = ch.codePointAt(0) ?? 0;
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    if (mime.startsWith('image/') || mime === 'application/pdf') {
      link.target = '_blank';
    } else {
      link.download = fichier.nom;
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
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
      this.clientsApi.creer<any>({ nom, codeClient: '', adresse: '', contact: '', email: '' }).subscribe({
        next: () => this.loadClients(),
        error: () => {}
      });
    }
  }

  loadEmployes() {
    this.utilisateursApi.lister<any>().subscribe({
      next: (data) => this.employes = data,
      error: () => this.employes = []
    });
  }

  /** Charge la page courante (20 projets) avec les filtres actifs — remplace
   * l'ancien loadTaches() qui rapatriait tous les projets en un seul appel. */
  chargerPage() {
    this.chargementTaches = true;
    this.tachesApi.page<any>({
      page: this.pageActuelle,
      size: this.taillePage,
      statut: this.filtreStatutTache ? this.mapStatutToBackend(this.filtreStatutTache) : undefined,
      priorite: this.filtrePrioriteTache || undefined,
      client: this.filtreClientTache || undefined,
      recherche: this.rechercheTache.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.taches = res.content.map(t => this.mapFromBackend(t));
        this.taches.forEach(tache => { tache.notes = this.loadNotesForTache(tache.id); });
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.chargementTaches = false;
      },
      error: () => {
        this.taches = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.chargementTaches = false;
      }
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
      statut: this.normaliserStatut(t.statut),
      date: t.dateCreation ? new Date(t.dateCreation).toLocaleDateString('fr-FR') : '',
      priorite: t.priorite || 'Moyenne',
      echeance: t.dateEcheance || '',
      client: t.client || '',
      clientFinal: t.clientFinal || '',
      adresse: t.adresse || '',
      chiffreAffaire: t.chiffreAffaire || '',
      numCommande: t.description || '',
      numDevis: t.numDevis || '',
      caDevis: t.caDevis || '',
      fichiers: this.parseJsonField(t.fichiers, []),
      assignes: this.parseJsonField(t.assignes, []),
      notes: [],
      etapes: this.parseJsonField(t.etapes, ETAPES_PROJET.map(nom => ({ nom, done: false, doneBy: '', doneAt: '' })))
    };
  }

  mapStatutToBackend(statutFr: string): string {
    return statutFr;
  }

  /** Ramène un statut venant de la BDD à l'une des 6 valeurs autorisées.
   * Couvre les anciens codes/libellés déjà en base (dont ceux de prod, inconnus
   * à l'avance) — tout ce qui n'est pas reconnu devient "Qualification". */
  normaliserStatut(statutBrut: string): string {
    const map: any = {
      'A_FAIRE': 'Qualification', 'EN_COURS': 'En cours', 'TERMINEE': 'Réalisé',
      'En Qualification': 'Qualification', 'En Attente': 'Qualification',
      'Fait': 'Réalisé', 'Validation Resp': 'Devis', 'Bon de commande': 'Commande',
      'Réalisation': 'Réalisé', 'Clôture': 'Réalisé'
    };
    if (this.statuts.includes(statutBrut)) return statutBrut;
    return map[statutBrut] || 'Qualification';
  }

  buildBody(tache: any, statut?: string): any {
    return {
      titre: tache.projet,
      description: tache.numCommande || '',
      priorite: tache.priorite,
      statut: statut || this.mapStatutToBackend(tache.statut),
      dateEcheance: tache.echeance && tache.echeance.match(/^\d{4}-\d{2}-\d{2}$/) ? tache.echeance : null,
      client: tache.client || '',
      clientFinal: tache.clientFinal || '',
      adresse: tache.adresse || '',
      chiffreAffaire: tache.chiffreAffaire || '',
      numDevis: tache.numDevis || '',
      caDevis: tache.caDevis || '',
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

    if (etape.done) {
      // Étape déjà validée — irréversible
      alert(`L'étape « ${etape.nom} » est définitivement validée et ne peut plus être annulée.`);
      return;
    }

    // Vérifier que toutes les étapes précédentes sont cochées avant de cocher celle-ci
    for (let i = 0; i < index; i++) {
      if (!tache.etapes[i].done) {
        alert(`Vous devez d'abord valider l'étape « ${tache.etapes[i].nom} » avant de passer à « ${etape.nom} ».`);
        return;
      }
    }

    etape.done = true;
    etape.doneBy = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    etape.doneAt = new Date().toLocaleString('fr-FR');
    tache.statut = etape.nom === 'Clôture' ? 'Réalisé' : this.normaliserStatut(etape.nom);
    this.tachesApi.modifier<any>(tache.id, this.buildBody(tache)).subscribe();
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
    if (this.nouvelleTache.date && this.nouvelleTache.echeance && this.nouvelleTache.echeance < this.nouvelleTache.date) {
      alert("L'échéance ne peut pas être avant la date de début du projet.");
      return;
    }
    const body = this.buildBody(this.nouvelleTache, 'A_FAIRE');
    body.etapes = JSON.stringify(ETAPES_PROJET.map(nom => ({ nom, done: false, doneBy: '', doneAt: '' })));
    this.tachesApi.creer<any>(body).subscribe({
      next: () => {
        this.resetFormAdd();
        this.showFormAdd = false;
        // Le nouveau projet est trié en premier (dateCreation DESC) -> page 0.
        this.pageActuelle = 0;
        this.chargerPage();
        this.scrollListeEnHaut();
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
    if (this.tacheEnEdition.date && this.tacheEnEdition.echeance && this.tacheEnEdition.echeance < this.tacheEnEdition.date) {
      alert("L'échéance ne peut pas être avant la date de début du projet.");
      return;
    }
    this.tachesApi.modifier<any>(this.tacheEnEdition.id, this.buildBody(this.tacheEnEdition)).subscribe({
      next: () => {
        this.resetFormEdit();
        this.showFormEdit = false;
        this.chargerPage();
        this.scrollListeEnHaut();
      },
      error: () => alert('Erreur modification')
    });
  }

  supprimerTache(id: number) {
    if (confirm('Supprimer cette tâche ?')) {
      this.tachesApi.supprimer(id).subscribe({
        next: () => {
          // Si on supprime le dernier élément d'une page qui n'est plus la première, reculer d'une page.
          if (this.taches.length === 1 && this.pageActuelle > 0) this.pageActuelle--;
          this.chargerPage();
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
      'ADMINISTRATEUR': '#1565c0', 'MANAGER': '#283593',
      'TECHNICIEN_SUP': '#4527a0',
      'TECHNICIEN': '#01579b', 'DIRECTION': '#5e35b1'
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
      projet: '', statut: 'Qualification', date: new Date().toLocaleDateString('fr-FR'),
      priorite: 'Moyenne', fichiers: [], assignes: [],
      echeance: '', client: '', clientFinal: '', adresse: '', chiffreAffaire: '', numCommande: '', numDevis: '', caDevis: ''
    };
  }

  resetFormEdit() { this.tacheEnEdition = {}; }

  onFileSelectAdd(event: any) {
    const files = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nouvelleTache.fichiers.push({
          nom: file.name,
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

  supprimerFichier(index: number) { this.nouvelleTache.fichiers.splice(index, 1); }
  supprimerFichierEdit(index: number) { this.tacheEnEdition.fichiers?.splice(index, 1); }

  onFileSelectEdit(event: any) {
    const files = event.target.files;
    if (!files) return;
    if (!this.tacheEnEdition.fichiers) this.tacheEnEdition.fichiers = [];
    for (const file of Array.from(files as FileList)) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tacheEnEdition.fichiers.push({
          nom: file.name,
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

  /** Classe de la ligne selon la proximité de l'échéance :
   * ≤ 5 jours restants (ou dépassée) -> rouge, ≤ 15 jours -> jaune, sinon rien. */
  getEcheanceRowClass(tache: any): string {
    if (!tache.echeance) return '';
    const echeance = new Date(tache.echeance);
    if (isNaN(echeance.getTime())) return '';
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    echeance.setHours(0, 0, 0, 0);
    const joursRestants = Math.round((echeance.getTime() - aujourdhui.getTime()) / 86400000);
    if (joursRestants <= 5) return 'row-echeance-rouge';
    if (joursRestants <= 15) return 'row-echeance-jaune';
    return '';
  }

  getStatutColor(statut: string): string {
    const colors: any = {
      'Qualification': '#9e9e9e', 'Devis': '#f57f17', 'Commande': '#1565c0',
      'En cours': '#FFA500', 'Réalisé': '#00CC00', 'Perdu': '#FF0000'
    };
    return colors[statut] || '#CCCCCC';
  }

  getPrioriteBg(priorite: string): string {
    const colors: any = { 'Faible': '#eff7f3', 'Élevé': '#f8eefa', 'Moyenne': '#faf1e6' };
    return colors[priorite] || '#f1f3f5';
  }

  getPrioriteTextColor(priorite: string): string {
    const colors: any = { 'Faible': '#5c9080', 'Élevé': '#8e44ad', 'Moyenne': '#9c8366' };
    return colors[priorite] || '#78909c';
  }

  getEmployeeName(employeId: number): string {
    const emp = this.employes.find((e: any) => e.id === employeId);
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
  }

  /** Liste des clients triée par ordre alphabétique — utilisée dans le champ
   * Client (input + datalist) des formulaires ajout/édition de projet. Le
   * filtrage par saisie est géré nativement par le navigateur via <datalist>. */
  get clientsTries(): any[] {
    return [...this.clients]
      .filter((c: any) => c.actif !== false)
      .sort((a: any, b: any) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
  }
}