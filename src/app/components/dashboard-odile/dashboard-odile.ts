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
import { Semenier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing'; // ✅ AJOUT
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
@Component({
  selector: 'app-dashboard-odile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, FichesCompletees, Factures, Documents, Semenier, Planning, 
    TicketingComponent , // ✅ AJOUT
    RemonteesTerrainComponent // ✅ AJOUT
  ],
  templateUrl: './dashboard-odile.html',
  styleUrl: './dashboard-odile.css'
})
export class DashboardOdile implements OnInit {
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
  factures: any[] = [];
  reclamations: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;
  selectedReclamation: any = null;

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

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
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

loadReclamations() {
  this.http.get<any[]>('http://localhost:8080/api/reclamations-sse')
    .subscribe({
      next: (data) => this.reclamations = data,
      error: () => {
        const stored = localStorage.getItem('reclamations');
        this.reclamations = stored ? JSON.parse(stored) : [];
      }
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
      { id: 1, numero: 'FAC-2026-001', client: 'Client A', montant: '5000€', date: '2026-01-15', statut: 'PAYEE' },
      { id: 2, numero: 'FAC-2026-002', client: 'Client B', montant: '3500€', date: '2026-01-12', statut: 'EN_ATTENTE' },
      { id: 3, numero: 'FAC-2026-003', client: 'Client C', montant: '7200€', date: '2026-01-10', statut: 'PAYEE' },
      { id: 4, numero: 'FAC-2026-004', client: 'Client D', montant: '4100€', date: '2026-01-08', statut: 'EN_ATTENTE' },
      { id: 5, numero: 'FAC-2026-005', client: 'Client E', montant: '2800€', date: '2026-01-05', statut: 'PAYEE' }
    ];
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
  }

  deposerConge() {
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur', error));
  }

  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }
  ouvrirDetailReclamation(rec: any) { this.selectedReclamation = rec; this.showReclamationDetailModal = true; }
  fermerDetailReclamation() { this.showReclamationDetailModal = false; this.selectedReclamation = null; }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Tableau de Bord';
      case 'fiches': return 'Fiches d\'Intervention';
      case 'fiches-completees': return '✅ Fiches Complétées';
      case 'ged': return '📄 Documents';
      case 'tickets': return '🎫 Tickets Clients';
      case 'rh': return '👥 Ressources Humaines';
      case 'factures': return '💰 Factures';
      case 'planning': return '📅 Planning';
      case 'semenier': return '📆 Semenier';
      case 'mes-conges': return '🏖️ Mes Congés';
      case 'remonteesTerrain': return '⚠️ Remontées Terrain';
      default: return 'Dashboard Odile';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}