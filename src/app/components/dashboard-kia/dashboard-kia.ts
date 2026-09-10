import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Planning } from '../planning/planning';
import { Semainier } from '../semenier/semenier';
import { Documents } from '../documents/documents';
import { MiseAuTravail } from '../mise-au-travail/mise-au-travail';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { GestionClients } from '../clients/clients';
import { Taches } from '../taches/taches';
import { JournalTravail } from '../journal-travail/journal-travail';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import { CongesApi, FichesInterventionApi, ReclamationsApi, UtilisateursApi } from '../../services/api/apis';

const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Mon espace',
  roleLabel: 'Tech Sup',
  badge: 'TECH SUP',
  gradient: 'linear-gradient(180deg, #020c1b 0%, #0a1628 50%, #071020 100%)',
  accent: '#4527a0',
  accentSoft: '#ede7f6',
  tag: '#b39ddb',
  items: [
    { key: 'home', icon: 'dashboard', label: 'Dashboard', section: 'Principal' },
    { key: 'fiches', icon: 'description', label: 'Fiches d\'Intervention' },
    { key: 'fiches-completees', icon: 'check_circle', label: 'Fiches Complétées' },
    { key: 'taches', icon: 'task_alt', label: 'Gestion des Projets' },
    { key: 'planning', icon: 'calendar_month', label: 'Planning' },
    { key: 'Semainier', icon: 'calendar_today', label: 'Semainier' },
    { key: 'journal', icon: 'auto_awesome', label: 'Journal IA' },
    { key: 'clients', icon: 'people', label: 'Gestion des Clients', section: 'Gestion' },
    { key: 'mise-au-travail', icon: 'engineering', label: 'Mise au Travail' },
    { key: 'ged', icon: 'folder_open', label: 'Documents' },
    { key: 'conges-tech', icon: 'fact_check', label: 'Congés à Valider', section: 'RH & Support' },
    { key: 'mes-conges', icon: 'beach_access', label: 'Mes Congés' },
    { key: 'remonteesTerrain', icon: 'report_problem', label: 'Remontées Terrain' },
    { key: 'approvisionnement', icon: 'shopping_cart', label: 'Demandes Appro.', section: 'Approvisionnement' }
  ]
};

@Component({
  selector: 'app-dashboard-kia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, FichesCompletees,
    Planning, Semainier, Documents,
    MiseAuTravail, RemonteesTerrainComponent, ApprovisionnementComponent, GestionClients, Taches, JournalTravail,
    DashboardLayout
  ],
  templateUrl: './dashboard-kia.html',
  styleUrl: './dashboard-kia.css'
})
export class DashboardKia implements OnInit {
  espace = ESPACE;
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this.fermerDetailReclamation();
    this._currentPage = value;
  }

  showCongeForm = false;
  showDetailModal = false;
  showReclamationDetailModal = false;

  congesTechniciens: any[] = [];
  mesConges: any[] = [];
  employes: any[] = [];
  reclamations: any[] = [];
  interventions: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;
  selectedReclamation: any = null;
  soldeConges: any = null;
  selectedConge: any = null;
  showCongeDetail = false;

  pourcentageSoldeRestant(restant: number, total: number): number {
    if (!total) return 0;
    return Math.max(0, Math.min(100, (restant / total) * 100));
  }

  ouvrirDetailConge(c: any) { this.selectedConge = c; this.showCongeDetail = true; }
  fermerDetailConge() { this.showCongeDetail = false; this.selectedConge = null; }

  conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
  nombreJours = 0;
  congeEnEditionId: number | null = null;

  constructor(
    private readonly congesApi: CongesApi,
    private readonly utilisateursApi: UtilisateursApi,
    private readonly reclamationsApi: ReclamationsApi,
    private readonly fichesInterventionApi: FichesInterventionApi
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadReclamations();
    this.loadInterventions();
    this.loadFiches();
    this.loadSoldeConges();
  }

  loadConges() {
    this.congesApi.lister<any>().subscribe({
      next: (data) => {
        this.congesTechniciens = data.filter((c: any) => c.utilisateur?.role === 'TECHNICIEN');
        this.mesConges = data.filter((c: any) => c.utilisateur?.id === this.user.id);
      },
      error: () => { this.congesTechniciens = []; this.mesConges = []; }
    });
  }

  loadSoldeConges() {
    if (!this.user.id) return;
    this.congesApi.solde(this.user.id).subscribe({
      next: (data) => this.soldeConges = data,
      error: () => this.soldeConges = null
    });
  }

  filtreConge = 'TOUS';

  getCongesTechEnAttente(): number {
    return this.congesTechniciens.filter((c: any) => c.statut === 'EN_ATTENTE').length;
  }

  getCongesTechApprouves(): number {
    return this.congesTechniciens.filter((c: any) => c.statut === 'APPROUVE').length;
  }

  getCongesTechRefuses(): number {
    return this.congesTechniciens.filter((c: any) => c.statut === 'REFUSE').length;
  }

  getCongesTechValideesKia(): number {
    return this.congesTechniciens.filter((c: any) => c.statut === 'VALIDE_KIA').length;
  }

  getCongesTechFiltres(): any[] {
    if (this.filtreConge === 'TOUS') return this.congesTechniciens;
    return this.congesTechniciens.filter((c: any) => c.statut === this.filtreConge);
  }

  // ✅ Version string pour affichage (différente de calculerJours qui retourne number)
  calculerJoursStr(dateDebut: string, dateFin: string, periode?: string): string {
    if (!dateDebut || !dateFin || dateDebut === '-' || dateFin === '-') return '-';
    const jours = this.calculerJours(dateDebut, dateFin, periode);
    if (jours === 0) return '-';
    let suffixe = '';
    if (periode === 'MATIN') suffixe = ' (Matin)';
    else if (periode === 'APRES_MIDI') suffixe = ' (Après-midi)';
    return `${jours}j${suffixe}`;
  }

  loadEmployes() {
    this.utilisateursApi.lister<any>().subscribe({
      next: (data) => this.employes = data,
      error: () => this.employes = []
    });
  }

  loadReclamations() {
    this.reclamationsApi.lister<any>().subscribe({
      next: (data) => this.reclamations = data,
      error: () => this.reclamations = []
    });
  }

  loadInterventions() {
    this.fichesInterventionApi.lister<any>().subscribe({
      next: (data) => this.interventions = data,
      error: () => this.interventions = []
    });
  }

  loadFiches() {
    this.fichesInterventionApi.lister<any>().subscribe({
      next: (data) => this.fiches = data.filter((f: any) => f.technicienId !== this.user.id),
      error: () => this.fiches = []
    });
  }

  showSoldeEpuiseWarning = false;
  joursEnTropSolde = 0;

  deposerConge() {
    if (this.conge.dateDebut && this.conge.dateFin && this.conge.dateFin < this.conge.dateDebut) {
      alert('La date de fin ne peut pas être avant la date de début.');
      return;
    }
    if (this.conge.type === 'ANNUEL' && this.soldeConges) {
      const restant = this.soldeConges.soldeAnnuelRestant || 0;
      if (this.nombreJours > restant) {
        this.joursEnTropSolde = this.nombreJours - Math.max(0, restant);
        this.showSoldeEpuiseWarning = true;
        return;
      }
    }
    this.envoyerConge();
  }

  confirmerEnvoiMalgreSolde() {
    this.showSoldeEpuiseWarning = false;
    this.envoyerConge();
  }

  private envoyerConge() {
    const joursDepassement = this.joursEnTropSolde > 0 ? this.joursEnTropSolde : null;
    if (this.congeEnEditionId) {
      this.congesApi.modifier(this.congeEnEditionId, { ...this.conge, joursDepassement }).subscribe({
        next: () => { this.loadConges(); this.loadSoldeConges(); this.showCongeForm = false; this.resetCongeForm(); },
        error: () => {}
      });
      return;
    }
    const demande = { ...this.conge, joursDepassement, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.congesApi.creer(demande).subscribe({
      next: () => { this.loadConges(); this.loadSoldeConges(); this.showCongeForm = false; this.resetCongeForm(); },
      error: () => {}
    });
  }

  modifierMonConge(c: any) {
    this.congeEnEditionId = c.id;
    this.conge = { dateDebut: c.dateDebut, dateFin: c.dateFin, type: c.type, motif: c.motif || '', description: c.description || '', periode: c.periode || '' };
    this.calculerNombreJours();
    this.showCongeForm = true;
    this.showCongeDetail = false;
  }

  supprimerMonConge(id: number) {
    if (!confirm('Supprimer cette demande de congé ?')) return;
    this.congesApi.supprimer(id).subscribe({
      next: () => {
        this.loadConges();
        this.loadSoldeConges();
        this.showCongeDetail = false;
        this.selectedConge = null;
      },
      error: () => alert('Erreur lors de la suppression')
    });
  }

  calculerNombreJours() {
    if (this.conge.dateDebut !== this.conge.dateFin) this.conge.periode = '';
    if (this.conge.dateDebut && this.conge.dateFin) {
      this.nombreJours = this.calculerJours(this.conge.dateDebut, this.conge.dateFin, this.conge.periode);
    } else {
      this.nombreJours = 0;
    }
  }

  onToggleDemiJournee(checked: boolean) {
    this.conge.periode = checked ? 'MATIN' : '';
    this.calculerNombreJours();
  }

  calculerJours(dateDebut: string, dateFin: string, periode?: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return 0;
    if (dateDebut === dateFin && (periode === 'MATIN' || periode === 'APRES_MIDI')) return 0.5;
    let jours = 0;
    const courant = new Date(debut);
    while (courant <= fin) {
      const jourSemaine = courant.getDay();
      if (jourSemaine !== 0 && jourSemaine !== 6) jours++;
      courant.setDate(courant.getDate() + 1);
    }
    return jours;
  }

  resetCongeForm() {
    this.conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
    this.nombreJours = 0;
    this.congeEnEditionId = null;
    this.joursEnTropSolde = 0;
  }

  updateStatutConge(id: number, statut: string) {
    this.congesApi.changerStatut(id, statut).subscribe({
      next: () => this.loadConges(),
      error: () => {}
    });
  }

  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }
  ouvrirDetailReclamation(rec: any) { this.selectedReclamation = rec; this.showReclamationDetailModal = true; }
  fermerDetailReclamation() { this.showReclamationDetailModal = false; this.selectedReclamation = null; }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches Intervention';
      case 'fiches-completees': return 'Fiches Completees';
      case 'planning': return 'Planning';
      case 'Semainier': return 'Semainier';
      case 'ged': return 'Documents';
      case 'conges-tech': return 'Conges a Valider';
      case 'mes-conges': return 'Mes Conges';
      case 'remonteesTerrain': return 'Remontees Terrain';
      case 'mise-au-travail': return 'Fiches Mise au Travail';
      default: return 'KIA Dashboard';
    }
  }
}
