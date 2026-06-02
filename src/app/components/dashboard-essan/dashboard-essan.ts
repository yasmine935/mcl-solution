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
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-dashboard-essan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTabsModule
  ],
  templateUrl: './dashboard-essan.html',
  styleUrl: './dashboard-essan.css'
})
export class DashboardEssan implements OnInit {
  user: any = {};
  sidebarOpen = false;

  private _currentPage = 'dashboard';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.fermerAllModals();
    this._currentPage = value;
  }

  // Modals
  showReclamationDetailModal = false;
  showSemainiersDetailModal = false;
  showFichesDetailModal = false;
  selectedReclamation: any = null;
  selectedSemainier: any = null;
  selectedFiche: any = null;

  // Data
  reclamations: any[] = [];
  SemainiersGlobal: Record<string, any> = {};
  SemainiersGlobalKeys: string[] = [];
  plannings: any[] = [];
  fiches: any[] = [];
  factures: any[] = [];
  stock: any[] = [];
  commandes: any[] = [];
  conges: any[] = [];
  taches: any[] = [];
  clients: any[] = [];
  employes: any[] = [];

  // KPI Stats
  totalReclamations = 0;
  totalFiches = 0;
  totalFactures = 0;
  totalCommandes = 0;
  totalConges = 0;
  montantTotalFactures = 0;

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Vérifier que l'utilisateur a le rôle ESSAN
    if (this.user.role !== 'ESSAN') {
      console.warn('Accès refusé - Rôle ESSAN requis');
      this.router.navigate(['/login']);
      return;
    }

    this.loadAllData();
  }

  loadAllData() {
    this.loadReclamations();
    this.loadSemainiersGlobal();
    this.loadPlannings();
    this.loadFiches();
    this.loadFactures();
    this.loadStock();
    this.loadCommandes();
    this.loadConges();
    this.loadTaches();
    this.loadClients();
    this.loadEmployes();
    this.calculateKPI();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadReclamations() {
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
      next: (data) => { this.reclamations = data; this.totalReclamations = data.length; },
      error: () => { this.reclamations = []; this.totalReclamations = 0; }
    });
  }

  loadSemainiersGlobal() {
    this.SemainiersGlobal = {};
    this.SemainiersGlobalKeys = [];
  }

  loadPlannings() {
    this.http.get<any[]>('http://localhost:8080/api/planning').subscribe({
      next: (data) => this.plannings = data,
      error: () => this.plannings = []
    });
  }

  loadFiches() {
    this.http.get<any[]>('http://localhost:8080/api/fiches-intervention').subscribe({
      next: (data) => { this.fiches = data; this.totalFiches = data.length; },
      error: () => { this.fiches = []; this.totalFiches = 0; }
    });
  }

  loadFactures() {
    this.http.get<any[]>('http://localhost:8080/api/factures').subscribe({
      next: (data) => {
        this.factures = data;
        this.totalFactures = data.length;
        this.montantTotalFactures = data.reduce((sum: number, f: any) =>
          sum + (Number.parseFloat(f.montantHT) * (1 + Number.parseFloat(f.tva) / 100) || 0), 0);
      },
      error: () => { this.factures = []; this.totalFactures = 0; this.montantTotalFactures = 0; }
    });
  }

  loadStock() {
    this.http.get<any[]>('http://localhost:8080/api/stock').subscribe({
      next: (data) => this.stock = data,
      error: () => this.stock = []
    });
  }

  loadCommandes() {
    this.http.get<any[]>('http://localhost:8080/api/commandes').subscribe({
      next: (data) => { this.commandes = data; this.totalCommandes = data.length; },
      error: () => { this.commandes = []; this.totalCommandes = 0; }
    });
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (data) => { this.conges = data; this.totalConges = data.length; },
      error: () => { this.conges = []; this.totalConges = 0; }
    });
  }

  loadTaches() {
    this.http.get<any[]>('http://localhost:8080/api/taches').subscribe({
      next: (data) => this.taches = data,
      error: () => this.taches = []
    });
  }

  loadClients() {
    this.http.get<any[]>('http://localhost:8080/api/clients').subscribe({
      next: (data) => this.clients = data,
      error: () => this.clients = []
    });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => this.employes = data,
      error: () => this.employes = []
    });
  }

  // ==================== CALCUL DES KPI ====================

  calculateKPI() {
    // Les KPI sont calculés au-dessus dans les load methods
    // Ici on peut ajouter des statistiques plus complexes si besoin
  }

  getTotalStockValue(): number {
    return this.stock.reduce((sum: number, item: any) => {
      return sum + (Number.parseFloat(item.quantite) * Number.parseFloat(item.prixUnitaire) || 0);
    }, 0);
  }

  getCongesEnAttente(): number {
    return this.conges.filter((c: any) => c.statut === 'EN_ATTENTE').length;
  }

  // ==================== MODALS ====================

  ouvrirDetailReclamation(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.showReclamationDetailModal = true;
  }

  fermerDetailReclamation() {
    this.showReclamationDetailModal = false;
    this.selectedReclamation = null;
  }

  ouvrirDetailSemainier(userId: string) {
    const clés = Object.keys(this.SemainiersGlobal).filter((k: string) => k.startsWith(userId + '_'));
    if (clés.length > 0) {
      this.selectedSemainier = this.SemainiersGlobal[clés[0]];
      this.showSemainiersDetailModal = true;
    }
  }

  fermerDetailSemainier() {
    this.showSemainiersDetailModal = false;
    this.selectedSemainier = null;
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showFichesDetailModal = true;
  }

  fermerDetailFiche() {
    this.showFichesDetailModal = false;
    this.selectedFiche = null;
  }

  fermerAllModals() {
    this.fermerDetailReclamation();
    this.fermerDetailSemainier();
    this.fermerDetailFiche();
  }

  // ==================== PAGE TITLE ====================

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'dashboard': return '📊 Dashboard ESSAN';
      case 'SemainiersGlobal': return '📅 Semainieres (TOUS)';
      case 'planningsGlobal': return '📆 Plannings (TOUS)';
      case 'fichesGlobal': return '📋 Fiches Complétées (TOUS)';
      case 'factures': return '💰 Factures';
      case 'stock': return '📦 Stock';
      case 'commandes': return '🛒 Commandes';
      case 'conges': return '🏖️ Congés';
      case 'reclamations': return '⚠️ Remontées Terrain';
      case 'projets': return '📊 Projets';
      case 'clients': return '👥 Clients';
      case 'employes': return '👷 Employés';
      default: return 'ESSAN Dashboard';
    }
  }

  // ==================== LOGOUT ====================

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}

