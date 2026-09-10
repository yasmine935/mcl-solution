import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { Employes } from '../employes/employes';
import { Taches } from '../taches/taches';
import { Documents } from '../documents/documents';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Semainier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';
import { Voitures } from '../voitures/voitures';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { GestionClients } from '../clients/clients';
import { CategoriesTaches } from '../categories-taches/categories-taches';
import { JournalTravail } from '../journal-travail/journal-travail';
import { Visiteurs } from '../visiteurs/visiteurs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import {
  UtilisateursApi, CongesApi, FichesInterventionApi, TachesApi,
  VoituresApi, MinutesSecuriteApi, MessagesAbyApi, ReclamationsApi
} from '../../services/api/apis';
import { Auth } from '../../services/auth';

const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Espace de travail',
  roleLabel: 'Admin',
  badge: 'ADMINISTRATEUR',
  gradient: 'linear-gradient(180deg, #020c1b 0%, #0a1628 50%, #071020 100%)',
  accent: '#1565c0',
  accentSoft: '#e3f2fd',
  tag: '#90caf9',
  items: [
    { key: 'home', icon: 'dashboard', label: 'Dashboard', section: 'Principal' },
    { key: 'interventions', icon: 'engineering', label: 'Fiches Intervention' },
    { key: 'fiches-completees', icon: 'check_circle', label: 'Fiches Complétées' },
    { key: 'taches', icon: 'task_alt', label: 'Gestion des Projets' },
    { key: 'planning', icon: 'calendar_month', label: 'Planning' },
    { key: 'clients', icon: 'people', label: 'Gestion des Clients', section: 'Gestion' },
    { key: 'categories-taches', icon: 'category', label: 'Catégories de Tâches' },
    { key: 'journal', icon: 'auto_awesome', label: 'Journal IA' },
    { key: 'mes-conges', icon: 'beach_access', label: 'Mes Congés' },
    { key: 'conges', icon: 'fact_check', label: 'Congés Équipe' },
    { key: 'employes', icon: 'people_alt', label: 'Employés' },
    { key: 'Semainier', icon: 'calendar_today', label: 'Semainier' },
    { key: 'documents', icon: 'folder_open', label: 'Documents' },
    { key: 'voitures', icon: 'directions_car', label: 'Parc Automobile' },
    { key: 'visiteurs', icon: 'badge', label: 'Visiteurs (Écran accueil)' },
    { key: 'approvisionnement', icon: 'shopping_cart', label: 'Demandes Appro.', section: 'Approvisionnement' },
    { key: 'reclamations', icon: 'report_problem', label: 'Remontées Terrain', section: 'Support' },
    { key: 'minutes-securite', icon: 'health_and_safety', label: 'Minutes Securite' },
    { key: 'messages-aby', icon: 'forum', label: 'Messages ABY', section: 'Communication' }
  ]
};

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, Employes, Taches, Documents, FichesCompletees, Semainier, Planning, TicketingComponent, Voitures, RemonteesTerrainComponent, ApprovisionnementComponent, GestionClients, CategoriesTaches, JournalTravail, Visiteurs,
    NgApexchartsModule, DashboardLayout
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdmin implements OnInit {
  espace = ESPACE;
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this.fermerDetailReclamation();
    this._currentPage = value;
  }

  onPageChange(page: string) {
    this.currentPage = page;
    if (page === 'messages-aby') this.loadMessagesAby();
  }

  showCreateFiche = false;
  showDetailFicheModal = false;
  showReclamationDetailModal = false;

  fiches: any[] = [];
  fichesFiltrees: any[] = [];
  ficheCompletees: any[] = [];
  conges: any[] = [];
  taches: any[] = [];
  employes: any[] = [];
  reclamations: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  utilisateurs: any[] = [];

  selectedFiche: any = null;
  selectedReclamation: any = null;
  techniciensDisponibles: any[] = [];

  nouveauFiche = {
    numero: '',
    client: '',
    description: '',
    date: '',
    technicienId: null,
    technicienNom: ''
  };
voitures: any[] = [];
showFormVoiture = false;

// ── MES CONGÉS (Ferid → ESSAN) ──
mesConges: any[] = [];
soldeCongesPerso: any = null;
selectedConge: any = null;
showCongeDetail = false;

pourcentageSoldeRestant(restant: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (restant / total) * 100));
}

ouvrirDetailConge(c: any) { this.selectedConge = c; this.showCongeDetail = true; }
fermerDetailConge() { this.showCongeDetail = false; this.selectedConge = null; }
showCongeFormPerso = false;
congePerso = { dateDebut: '', dateFin: '', type: 'ANNUEL', motif: '', description: '', periode: '' };
nombreJoursPerso = 0;
congePersoEnEditionId: number | null = null;
typesConge = ['ANNUEL', 'RTT', 'MALADIE', 'SANS_SOLDE', 'FORMATION'];
nouvelleVoiture = {
  immatriculation: '', marque: '', modele: '',
  annee: '', kilometrage: '', statut: 'Disponible',
  conducteur: '', prochainControle: ''
};
statutsVoiture = ['Disponible', 'En service', 'En maintenance', 'Hors service'];
  constructor(
    private utilisateursApi: UtilisateursApi,
    private congesApi: CongesApi,
    private fichesInterventionApi: FichesInterventionApi,
    private tachesApi: TachesApi,
    private voituresApi: VoituresApi,
    private minutesSecuriteApi: MinutesSecuriteApi,
    private messagesAbyApi: MessagesAbyApi,
    private reclamationsApi: ReclamationsApi,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }
minutesSecurite: any[] = [];

loadMinutesSecurite() {
  this.minutesSecuriteApi.lister().subscribe({
    next: (data) => this.minutesSecurite = data,
    error: () => this.minutesSecurite = []
  });
}

marquerMinuteLue(id: number) {
  this.minutesSecuriteApi.marquerLu(id).subscribe({
    next: () => {
      const m = this.minutesSecurite.find(x => x.id === id);
      if (m) m.statut = 'LU';
    }
  });
}

get minutesAlertes(): number {
  return this.minutesSecurite.filter(m => m.statut === 'ALERTE').length;
}

get minutesOk(): number {
  return this.minutesSecurite.filter(m => m.statut !== 'ALERTE').length;
}
  // Messagerie ABY
  messagesAby: any[] = [];
  messageAbySelectionne: any = null;
  reponseAbyTexte = '';
  reponseEnCours = false;
  repliesAdmin: any[] = [];

  loadMessagesAby() {
    this.messagesAbyApi.lister().subscribe({
      next: (data) => this.messagesAby = data,
      error: () => this.messagesAby = []
    });
  }

  ouvrirMessageAby(m: any) {
    this.messageAbySelectionne = m;
    this.repliesAdmin = [];
    this.reponseAbyTexte = '';
    this.messagesAbyApi.replies(m.id).subscribe({
      next: (data) => this.repliesAdmin = data,
      error: () => this.repliesAdmin = []
    });
    // Marquer comme lu
    if (!m.lu) {
      this.messagesAbyApi.put(`${m.id}/lu`, {}).subscribe({
        next: () => { m.lu = true; }
      });
    }
  }

  repondreMessageAby(id: number) {
    if (!this.reponseAbyTexte.trim()) { return; }
    this.reponseEnCours = true;
    const auteur = `${this.user.prenom || ''} ${this.user.nom || ''}`.trim() || 'MCL Solutions';
    const body = { auteur, auteurRole: 'MCL', contenu: this.reponseAbyTexte };
    this.messagesAbyApi.post<any>(`${id}/replies`, body).subscribe({
      next: (reply) => {
        this.repliesAdmin.push(reply);
        this.reponseAbyTexte = '';
        this.reponseEnCours = false;
      },
      error: () => { alert('Erreur lors de l\'envoi'); this.reponseEnCours = false; }
    });
  }

  get messagesAbyNonLus() { return this.messagesAby.filter(m => !m.lu).length; }

  loadData() {
  this.loadFiches();
  this.loadConges();
  this.loadEmployes();
  this.loadReclamations();
  this.loadDocuments();
  this.loadTickets();
  this.loadVoitures();
  this.loadMinutesSecurite();
  this.loadResetRequests();
  this.loadMesConges();
  this.loadSoldeCongesPerso();
  this.loadTaches();
  this.loadMessagesAby();
}

loadTaches() {
  this.tachesApi.lister().subscribe({
    next: (data) => this.taches = data,
    error: () => this.taches = []
  });
}

loadMesConges() {
  this.congesApi.parEmploye(this.user.id).subscribe({
    next: (data) => this.mesConges = data,
    error: () => this.mesConges = []
  });
}

loadSoldeCongesPerso() {
  if (!this.user.id) return;
  this.congesApi.solde(this.user.id).subscribe({
    next: (data) => this.soldeCongesPerso = data,
    error: () => this.soldeCongesPerso = null
  });
}

getEssanId(): number | null {
  const essan = this.employes.find((e: any) => e.role === 'DIRECTION');
  return essan ? essan.id : null;
}

showSoldeEpuiseWarning = false;
joursEnTropSolde = 0;

deposerCongePerso() {
  if (!this.congePerso.dateDebut || !this.congePerso.dateFin || !this.congePerso.type) {
    alert('Veuillez remplir les champs obligatoires'); return;
  }
  if (this.congePerso.dateFin < this.congePerso.dateDebut) {
    alert('La date de fin ne peut pas être avant la date de début.');
    return;
  }
  if (this.congePerso.type === 'ANNUEL' && this.soldeCongesPerso) {
    const restant = this.soldeCongesPerso.soldeAnnuelRestant || 0;
    if (this.nombreJoursPerso > restant) {
      this.joursEnTropSolde = this.nombreJoursPerso - Math.max(0, restant);
      this.showSoldeEpuiseWarning = true;
      return;
    }
  }
  this.envoyerCongePerso();
}

confirmerEnvoiMalgreSolde() {
  this.showSoldeEpuiseWarning = false;
  this.envoyerCongePerso();
}

private envoyerCongePerso() {
  const joursDepassement = this.joursEnTropSolde > 0 ? this.joursEnTropSolde : null;
  if (this.congePersoEnEditionId) {
    this.congesApi.modifier(this.congePersoEnEditionId, { ...this.congePerso, joursDepassement }).subscribe({
      next: () => {
        this.loadMesConges();
        this.loadSoldeCongesPerso();
        this.showCongeFormPerso = false;
        this.resetCongeFormPerso();
      },
      error: () => alert('Erreur lors de la modification')
    });
    return;
  }
  const essanId = this.getEssanId();
  if (!essanId) { alert('Responsable ESSAN introuvable'); return; }
  const demande = { ...this.congePerso, joursDepassement, utilisateur: { id: this.user.id }, manager: { id: essanId } };
  this.congesApi.creer(demande).subscribe({
    next: () => {
      this.loadMesConges();
      this.loadSoldeCongesPerso();
      this.showCongeFormPerso = false;
      this.resetCongeFormPerso();
      alert('Demande envoyée à ESSAN !');
    },
    error: () => alert('Erreur lors du dépôt')
  });
}

modifierMonConge(c: any) {
  this.congePersoEnEditionId = c.id;
  this.congePerso = { dateDebut: c.dateDebut, dateFin: c.dateFin, type: c.type, motif: c.motif || '', description: c.description || '', periode: c.periode || '' };
  this.calculerJoursPerso();
  this.showCongeFormPerso = true;
  this.showCongeDetail = false;
}

supprimerMonConge(id: number) {
  if (!confirm('Supprimer cette demande de congé ?')) return;
  this.congesApi.supprimer(id).subscribe({
    next: () => {
      this.loadMesConges();
      this.loadSoldeCongesPerso();
      this.showCongeDetail = false;
      this.selectedConge = null;
    },
    error: () => alert('Erreur lors de la suppression')
  });
}

calculerJoursPerso() {
  if (this.congePerso.dateDebut !== this.congePerso.dateFin) this.congePerso.periode = '';
  if (this.congePerso.dateDebut && this.congePerso.dateFin) {
    const d = new Date(this.congePerso.dateDebut);
    const f = new Date(this.congePerso.dateFin);
    if (f < d) { this.nombreJoursPerso = 0; return; }
    if (this.congePerso.dateDebut === this.congePerso.dateFin && (this.congePerso.periode === 'MATIN' || this.congePerso.periode === 'APRES_MIDI')) {
      this.nombreJoursPerso = 0.5;
      return;
    }
    let jours = 0;
    const courant = new Date(d);
    while (courant <= f) {
      const jourSemaine = courant.getDay();
      if (jourSemaine !== 0 && jourSemaine !== 6) jours++;
      courant.setDate(courant.getDate() + 1);
    }
    this.nombreJoursPerso = jours;
  }
}

onToggleDemiJourneePerso(checked: boolean) {
  this.congePerso.periode = checked ? 'MATIN' : '';
  this.calculerJoursPerso();
}

resetCongeFormPerso() {
  this.congePerso = { dateDebut: '', dateFin: '', type: 'ANNUEL', motif: '', description: '', periode: '' };
  this.nombreJoursPerso = 0;
  this.congePersoEnEditionId = null;
  this.joursEnTropSolde = 0;
}

  loadFiches() {
    this.fichesInterventionApi.lister().subscribe({
      next: (data) => {
        this.fiches = data;
        this.fichesFiltrees = data.filter((f: any) => f.statut === 'EN_COURS');
        this.ficheCompletees = data.filter((f: any) => f.statut === 'COMPLETEE');
      },
      error: () => { this.fiches = []; this.fichesFiltrees = []; this.ficheCompletees = []; }
    });
  }

  // ============================================================
// AJOUTER dans dashboard-admin.ts
// ============================================================

// 1. Dans les propriétés de la classe (après filtreConge):
filtreConge = 'TOUS';

// 2. Ajouter ces méthodes dans la classe :

getCongesEnAttente(): number {
  return this.conges.filter((c: any) => c.statut === 'EN_ATTENTE').length;
}

getCongesApprouves(): number {
  return this.conges.filter((c: any) => c.statut === 'APPROUVE').length;
}

getCongesRefuses(): number {
  return this.conges.filter((c: any) => c.statut === 'REFUSE').length;
}

getCongesValideesKia(): number {
  return this.conges.filter((c: any) => c.statut === 'VALIDE_KIA').length;
}

getCongesFiltres(): any[] {
  if (this.filtreConge === 'TOUS') return this.conges;
  return this.conges.filter((c: any) => c.statut === this.filtreConge);
}

calculerJours(dateDebut: string, dateFin: string, periode?: string): string {
  if (!dateDebut || !dateFin || dateDebut === '-' || dateFin === '-') return '-';
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (fin < debut) return '-';
  if (dateDebut === dateFin && (periode === 'MATIN' || periode === 'APRES_MIDI')) {
    return periode === 'MATIN' ? '0.5j (Matin)' : '0.5j (Après-midi)';
  }
  let jours = 0;
  const courant = new Date(debut);
  while (courant <= fin) {
    const jourSemaine = courant.getDay();
    if (jourSemaine !== 0 && jourSemaine !== 6) jours++;
    courant.setDate(courant.getDate() + 1);
  }
  return jours > 0 ? `${jours}j` : '-';
}
  loadConges() {
    this.congesApi.lister().subscribe({
      next: (data) => this.conges = data,
      error: () => this.conges = []
    });
  }

  loadEmployes() {
    this.utilisateursApi.lister().subscribe({
      next: (data) => {
        this.employes = data;
        this.utilisateurs = data;
        this.techniciensDisponibles = data.filter((e: any) =>
          e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP'
        );
      },
      error: () => { this.employes = []; this.utilisateurs = []; }
    });
  }

  loadReclamations() {
    this.reclamationsApi.lister().subscribe({
      next: (data) => this.reclamations = data,
      error: () => this.reclamations = []
    });
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Politique d\'entreprise', date: '2025-12-01', type: 'PDF' },
      { id: 2, nom: 'Manuel d\'utilisation', date: '2025-11-15', type: 'PDF' },
      { id: 3, nom: 'Charte de sécurité', date: '2025-10-01', type: 'DOCX' },
      { id: 4, nom: 'Procédures RH', date: '2025-09-20', type: 'PDF' }
    ];
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Problème critique système', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-18' },
      { id: 2, titre: 'Amélioration infrastructure', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-15' },
      { id: 3, titre: 'Migration données', statut: 'EN_COURS', priorite: 'HAUTE', date: '2026-01-16' },
      { id: 4, titre: 'Maintenance serveurs', statut: 'PLANIFIE', priorite: 'MOYENNE', date: '2026-01-20' }
    ];
  }

  creerFiche() {
    if (!this.nouveauFiche.numero || !this.nouveauFiche.client || !this.nouveauFiche.technicienId) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const idIncrement = Math.max(...this.fiches.map(f => f.id || 0), 0) + 1;
    const nouvelleFiche = {
      id: idIncrement,
      ...this.nouveauFiche,
      statut: 'EN_COURS',
      dateCreation: new Date().toISOString()
    };

    this.fiches.push(nouvelleFiche);
    this.fichesFiltrees.push(nouvelleFiche);
    this.showCreateFiche = false;
    this.nouveauFiche = { numero: '', client: '', description: '', date: '', technicienId: null, technicienNom: '' };
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showDetailFicheModal = true;
  }

  fermerDetailFiche() {
    this.showDetailFicheModal = false;
    this.selectedFiche = null;
  }

  updateStatut(id: number, statut: string) {
    const params: Record<string, string> = { statut };
    if (statut === 'APPROUVE' || statut === 'REFUSE') {
      const nomAdmin = `${this.user.prenom || ''} ${this.user.nom || ''}`.trim() || this.user.username || 'Admin';
      params['validePar'] = nomAdmin;
    }
    this.congesApi.put(`${id}/statut`, {}, params).subscribe({
      next: () => this.loadConges(),
      error: () => {}
    });
  }

  ouvrirDetailReclamation(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.showReclamationDetailModal = true;
  }

  fermerDetailReclamation() {
    this.showReclamationDetailModal = false;
    this.selectedReclamation = null;
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Tableau de Bord Admin';
      case 'fiches': return 'Fiches d\'Intervention';
      case 'tousLesConges': return 'Tous les Congés';
      case 'employes': return 'Employés';
      case 'documents': return 'Documents';
      case 'reclamations': return 'Réclamations';
      case 'support': return 'Support';
      case 'utilisateurs': return 'Utilisateurs';
      case 'tickets': return '🎫 Tickets Clients';
      default: return 'Dashboard Admin';
      case 'voitures': return '🚗 Parc Automobile';
    }
  }
loadVoitures() {
  this.voituresApi.lister().subscribe({
    next: (data) => this.voitures = data,
    error: () => this.voitures = []
  });
}

ajouterVoiture() {
  if (!this.nouvelleVoiture.immatriculation || !this.nouvelleVoiture.marque) {
    alert('Champs obligatoires manquants');
    return;
  }
  this.voituresApi.creer<any>(this.nouvelleVoiture).subscribe({
    next: () => {
      this.loadVoitures();
      this.nouvelleVoiture = { immatriculation: '', marque: '', modele: '', annee: '', kilometrage: '', statut: 'Disponible', conducteur: '', prochainControle: '' };
      this.showFormVoiture = false;
    },
    error: () => alert('Erreur lors de l\'ajout de la voiture')
  });
}

supprimerVoiture(id: number) {
  if (confirm('Supprimer ?')) {
    this.voituresApi.supprimer(id).subscribe({
      next: () => this.loadVoitures(),
      error: () => alert('Erreur suppression')
    });
  }
}

getStatutVoitureColor(statut: string): string {
  const map: any = { 'Disponible': '#2e7d32', 'En service': '#1565c0', 'En maintenance': '#f57f17', 'Hors service': '#c62828' };
  return map[statut] || '#546e7a';
}
  // ===== RESET PASSWORD =====
  resetRequests: any[] = [];
  showResetModal = false;
  selectedReset: any = null;
  newPassword = '';
  resetSuccess = '';

  loadResetRequests() {
    this.auth.demandesReset().subscribe({
      next: (data) => this.resetRequests = data,
      error: () => this.resetRequests = []
    });
  }

  ouvrirReset(req: any) {
    this.selectedReset = req;
    this.newPassword = '';
    this.resetSuccess = '';
    this.showResetModal = true;
  }

  fermerReset() { this.showResetModal = false; this.selectedReset = null; }

  confirmerReset() {
    if (!this.newPassword.trim()) { alert('Entrez un nouveau mot de passe'); return; }
    this.auth.reinitialiserMotDePasse(this.selectedReset.id, this.newPassword).subscribe({
      next: () => {
        this.resetSuccess = 'Mot de passe réinitialisé avec succès !';
        this.loadResetRequests();
        setTimeout(() => this.fermerReset(), 1500);
      },
      error: () => alert('Erreur lors de la réinitialisation')
    });
  }

  get countResetPending(): number { return this.resetRequests.length; }

  // ── BI CHARTS ──
  readonly chartDonutOptions = {
    chart: { type: 'donut' as const, height: 220, fontFamily: 'Roboto, sans-serif' },
    legend: { position: 'bottom' as const, fontSize: '12px' },
    dataLabels: { enabled: true },
    plotOptions: { pie: { donut: { size: '65%' } } }
  };

  readonly chartBarOptions = {
    chart: { type: 'bar' as const, height: 220, toolbar: { show: false }, fontFamily: 'Roboto, sans-serif' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f0f4f8' }
  };

  get chartFichesStatutSeries(): number[] {
    return [
      this.fiches.filter((f: any) => f.statut === 'EN_COURS').length,
      this.fiches.filter((f: any) => f.statut === 'COMPLETEE').length,
      this.fiches.filter((f: any) => f.statut === 'VALIDEE').length
    ];
  }

  get chartCongesTypeSeries(): number[] {
    return ['ANNUEL','RTT','MALADIE','SANS_SOLDE','FORMATION']
      .map(t => this.conges.filter((c: any) => c.type === t).length);
  }

  get chartFichesMoisSeries(): any[] {
    const mois: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mois[d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })] = 0;
    }
    this.fiches.forEach((f: any) => {
      const date = f.dateIntervention || f.dateCreation;
      if (!date) return;
      const key = new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (key in mois) mois[key]++;
    });
    return [{ name: 'Interventions', data: Object.values(mois) }];
  }

  get chartFichesMoisCategories(): string[] {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    });
  }

  get chartTachesStatutSeries(): number[] {
    const statuts = ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'Perdu', 'En Attente'];
    return statuts.map(s => this.taches.filter((t: any) => t.statut === s).length);
  }

  get chartTachesPrioriteSeries(): number[] {
    return ['Élevé', 'Moyenne', 'Faible']
      .map(p => this.taches.filter((t: any) => t.priorite === p).length);
  }
}


