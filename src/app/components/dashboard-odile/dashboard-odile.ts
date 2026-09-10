import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Documents } from '../documents/documents';
import { Semainier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { GestionClients } from '../clients/clients';
import { Taches } from '../taches/taches';
import { JournalTravail } from '../journal-travail/journal-travail';
import { CongesApi, ReclamationsApi, UtilisateursApi } from '../../services/api/apis';

const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Espace Manager',
  roleLabel: 'Manager',
  badge: 'MANAGER',
  items: [
    { key: 'home', icon: 'dashboard', label: 'Dashboard', section: 'Principal' },
    { key: 'fiches', icon: 'description', label: 'Fiches d\'Intervention' },
    { key: 'fiches-completees', icon: 'check_circle', label: 'Fiches Complétées' },
    { key: 'taches', icon: 'task_alt', label: 'Gestion des Projets' },
    { key: 'planning', icon: 'calendar_month', label: 'Planning' },
    { key: 'Semainier', icon: 'calendar_today', label: 'Semainier' },
    { key: 'journal', icon: 'auto_awesome', label: 'Journal IA' },
    { key: 'clients', icon: 'people', label: 'Gestion des Clients', section: 'Gestion' },
    { key: 'ged', icon: 'folder_open', label: 'Documents' },
    { key: 'approvisionnement', icon: 'assignment', label: 'Demandes Appro.', section: 'Approvisionnement' },
    { key: 'remonteesTerrain', icon: 'report_problem', label: 'Remontées Terrain', section: 'Support' },
    { key: 'mes-conges', icon: 'beach_access', label: 'Mes Congés' },
    { key: 'tickets-clients', icon: 'confirmation_number', label: 'Tickets Clients', route: '/tickets-clients', section: 'Support Client' }
  ],
  // Thème Bleu Acier / Dark Navy de l'ancien CSS (différent du violet par défaut du layout)
  gradient: 'linear-gradient(180deg, #020c1b 0%, #0a1628 50%, #071020 100%)',
  accent: '#0277bd',
  accentSoft: '#e1f5fe',
  tag: '#81d4fa'
};

@Component({
  selector: 'app-dashboard-odile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, DashboardLayout,
    FicheInterventionManager, FichesCompletees, Documents, Semainier, Planning,
    TicketingComponent, RemonteesTerrainComponent, ApprovisionnementComponent, GestionClients, Taches, JournalTravail
  ],
  templateUrl: './dashboard-odile.html',
  styleUrl: './dashboard-odile.css'
})
export class DashboardOdile implements OnInit {
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
  conges: any[] = [];
  employes: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  reclamations: any[] = [];
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
    private congesApi: CongesApi,
    private utilisateursApi: UtilisateursApi,
    private reclamationsApi: ReclamationsApi
  ) {}
  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }
  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadDocuments();
    this.loadReclamations();
    this.loadFiches();
    this.loadSoldeConges();
  }
  loadConges() {
    this.congesApi.parEmploye(this.user.id)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }
  loadSoldeConges() {
    if (!this.user.id) return;
    this.congesApi.solde(this.user.id).subscribe({
      next: (data) => this.soldeConges = data,
      error: () => this.soldeConges = null
    });
  }
  loadEmployes() {
    this.utilisateursApi.lister()
      .subscribe(data => this.employes = data, error => this.employes = []);
  }
  loadReclamations() {
    this.reclamationsApi.lister().subscribe({
      next: (data) => this.reclamations = data,
      error: () => { const s = localStorage.getItem('reclamations'); this.reclamations = s ? JSON.parse(s) : []; }
    });
  }
  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Archive 2025', date: '2025-12-31', type: 'PDF' },
      { id: 2, nom: 'Rapport Annuel 2025', date: '2025-12-20', type: 'PDF' },
      { id: 3, nom: 'Directives Entreprise', date: '2025-12-01', type: 'DOCX' },
      { id: 4, nom: 'Contrats Clients', date: '2025-11-15', type: 'PDF' },
      { id: 5, nom: 'Politique RH', date: '2025-10-01', type: 'DOCX' }
    ];
  }
  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
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
      this.congesApi.modifier(this.congeEnEditionId, { ...this.conge, joursDepassement }).subscribe(() => {
        this.loadConges(); this.loadSoldeConges(); this.showCongeForm = false; this.resetCongeForm();
      }, error => console.error('Erreur', error));
      return;
    }
    const demande = { ...this.conge, joursDepassement, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.congesApi.creer(demande).subscribe(() => {
      this.loadConges(); this.loadSoldeConges(); this.showCongeForm = false; this.resetCongeForm();
    }, error => console.error('Erreur', error));
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
    } else { this.nombreJours = 0; }
  }
  onToggleDemiJournee(checked: boolean) {
    this.conge.periode = checked ? 'MATIN' : '';
    this.calculerNombreJours();
  }
  calculerJours(dateDebut: string, dateFin: string, periode?: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut); const fin = new Date(dateFin);
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
  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }
  ouvrirDetailReclamation(rec: any) { this.selectedReclamation = rec; this.showReclamationDetailModal = true; }
  fermerDetailReclamation() { this.showReclamationDetailModal = false; this.selectedReclamation = null; }
  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Tableau de Bord';
      case 'fiches': return 'Fiches Intervention';
      case 'fiches-completees': return 'Fiches Completees';
      case 'ged': return 'Documents';
      case 'tickets': return 'Tickets Clients';
      case 'planning': return 'Planning';
      case 'Semainier': return 'Semainier';
      case 'mes-conges': return 'Mes Conges';
      case 'remonteesTerrain': return 'Remontees Terrain';
      case 'approvisionnement': return 'Demandes d\'Approvisionnement';
      default: return 'Dashboard Odile';
    }
  }
}


