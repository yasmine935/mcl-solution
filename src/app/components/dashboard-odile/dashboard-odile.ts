import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { Factures } from '../factures/factures';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Documents } from '../documents/documents';
import { Semainier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { GestionClients } from '../clients/clients';
import { Taches } from '../taches/taches';

@Component({
  selector: 'app-dashboard-odile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, FichesCompletees, Factures, Documents, Semainier, Planning,
    TicketingComponent, RemonteesTerrainComponent, ApprovisionnementComponent, GestionClients, Taches
  ],
  templateUrl: './dashboard-odile.html',
  styleUrl: './dashboard-odile.css'
})
export class DashboardOdile implements OnInit {
  user: any = {};
  sidebarOpen = false;
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
  factures: any[] = [];
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
  constructor(private http: HttpClient, private router: Router) {}
  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }
  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadDocuments();
    this.loadFactures();
    this.loadReclamations();
    this.loadFiches();
    this.loadSoldeConges();
  }
  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }
  loadSoldeConges() {
    if (!this.user.id) return;
    this.http.get<any>(`http://localhost:8080/api/conges/solde/${this.user.id}`).subscribe({
      next: (data) => this.soldeConges = data,
      error: () => this.soldeConges = null
    });
  }
  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }
  loadReclamations() {
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
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
  loadFactures() {
    this.factures = [
      { id: 1, numero: 'FAC-2026-001', client: 'Client A', montant: '5000EUR', date: '2026-01-15', statut: 'PAYEE' },
      { id: 2, numero: 'FAC-2026-002', client: 'Client B', montant: '3500EUR', date: '2026-01-12', statut: 'EN_ATTENTE' },
      { id: 3, numero: 'FAC-2026-003', client: 'Client C', montant: '7200EUR', date: '2026-01-10', statut: 'PAYEE' },
      { id: 4, numero: 'FAC-2026-004', client: 'Client D', montant: '4100EUR', date: '2026-01-08', statut: 'EN_ATTENTE' },
      { id: 5, numero: 'FAC-2026-005', client: 'Client E', montant: '2800EUR', date: '2026-01-05', statut: 'PAYEE' }
    ];
  }
  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
  }
  showSoldeEpuiseWarning = false;

  deposerConge() {
    if (this.conge.type === 'ANNUEL' && this.soldeConges && this.soldeConges.soldeAnnuelRestant <= 0) {
      this.showSoldeEpuiseWarning = true;
      return;
    }
    this.envoyerConge();
  }

  confirmerEnvoiMalgreSolde() {
    this.showSoldeEpuiseWarning = false;
    this.envoyerConge();
  }

  private envoyerConge() {
    if (this.congeEnEditionId) {
      this.http.put(`http://localhost:8080/api/conges/${this.congeEnEditionId}`, this.conge).subscribe(() => {
        this.loadConges(); this.loadSoldeConges(); this.showCongeForm = false; this.resetCongeForm();
      }, error => console.error('Erreur', error));
      return;
    }
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
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
    this.http.delete(`http://localhost:8080/api/conges/${id}`).subscribe({
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
      case 'factures': return 'Factures';
      case 'planning': return 'Planning';
      case 'Semainier': return 'Semainier';
      case 'mes-conges': return 'Mes Conges';
      case 'remonteesTerrain': return 'Remontees Terrain';
      case 'approvisionnement': return 'Demandes d\'Approvisionnement';
      default: return 'Dashboard Odile';
    }
  }
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}


