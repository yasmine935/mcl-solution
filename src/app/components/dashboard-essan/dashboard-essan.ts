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
  showSemeniersDetailModal = false;
  showFichesDetailModal = false;
  selectedReclamation: any = null;
  selectedSemenier: any = null;
  selectedFiche: any = null;

  // Data
  reclamations: any[] = [];
  semeniersGlobal: Record<string, any> = {};
  semeniersGlobalKeys: string[] = [];
  plannings: any[] = [];
  fiches: any[] = [];
  factures: any[] = [];
  stock: any[] = [];
  commandes: any[] = [];
  conges: any[] = [];

  // KPI Stats
  totalReclamations = 0;
  totalFiches = 0;
  totalFactures = 0;
  totalCommandes = 0;
  totalConges = 0;
  montantTotalFactures = 0;

  constructor(private http: HttpClient, private router: Router) {}

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
    this.loadSemeniersGlobal();
    this.loadPlannings();
    this.loadFiches();
    this.loadFactures();
    this.loadStock();
    this.loadCommandes();
    this.loadConges();
    this.calculateKPI();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadReclamations() {
    const stored = localStorage.getItem('reclamations');
    this.reclamations = stored ? JSON.parse(stored) : [];
    this.totalReclamations = this.reclamations.length;
  }

  loadSemeniersGlobal() {
    const stored = localStorage.getItem('semeniersGlobal');
    this.semeniersGlobal = stored ? JSON.parse(stored) : {};
    // Stocker les clés en tant que strings pour éviter les erreurs de type
    this.semeniersGlobalKeys = Object.keys(this.semeniersGlobal);
  }

  loadPlannings() {
    const stored = localStorage.getItem('planningNotes');
    if (stored) {
      const notes = JSON.parse(stored);
      // Grouper par utilisateur
      const planningsMap = new Map();
      for (const [key, value] of Object.entries(notes)) {
        const userId = key.split('_')[0];
        if (!planningsMap.has(userId)) {
          planningsMap.set(userId, []);
        }
        planningsMap.get(userId).push(value);
      }
      this.plannings = Array.from(planningsMap.values()).flat();
    }
  }

  loadFiches() {
    const stored = localStorage.getItem('fichesCompletees');
    this.fiches = stored ? JSON.parse(stored) : [];
    this.totalFiches = this.fiches.length;
  }

  loadFactures() {
    const stored = localStorage.getItem('factures');
    this.factures = stored ? JSON.parse(stored) : [];
    this.totalFactures = this.factures.length;
    this.montantTotalFactures = this.factures.reduce((sum: number, f: any) => {
      return sum + (parseFloat(f.montantHT) * (1 + parseFloat(f.tva) / 100) || 0);
    }, 0);
  }

  loadStock() {
    const stored = localStorage.getItem('stock');
    this.stock = stored ? JSON.parse(stored) : [];
  }

  loadCommandes() {
    const stored = localStorage.getItem('commandes');
    this.commandes = stored ? JSON.parse(stored) : [];
    this.totalCommandes = this.commandes.length;
  }

  loadConges() {
    const stored = localStorage.getItem('conges');
    this.conges = stored ? JSON.parse(stored) : [];
    this.totalConges = this.conges.length;
  }

  // ==================== CALCUL DES KPI ====================

  calculateKPI() {
    // Les KPI sont calculés au-dessus dans les load methods
    // Ici on peut ajouter des statistiques plus complexes si besoin
  }

  getTotalStockValue(): number {
    return this.stock.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.quantite) * parseFloat(item.prixUnitaire) || 0);
    }, 0);
  }

  getCongesEnAttente(): number {
    return this.conges.filter((c: any) => c.statut === 'EN ATTENTE').length;
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

  ouvrirDetailSemenier(userId: string) {
    const clés = Object.keys(this.semeniersGlobal).filter((k: string) => k.startsWith(userId + '_'));
    if (clés.length > 0) {
      this.selectedSemenier = this.semeniersGlobal[clés[0]];
      this.showSemeniersDetailModal = true;
    }
  }

  fermerDetailSemenier() {
    this.showSemeniersDetailModal = false;
    this.selectedSemenier = null;
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
    this.fermerDetailSemenier();
    this.fermerDetailFiche();
  }

  // ==================== PAGE TITLE ====================

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'dashboard': return '📊 Dashboard ESSAN';
      case 'semeniersGlobal': return '📅 Semenieres (TOUS)';
      case 'planningsGlobal': return '📆 Plannings (TOUS)';
      case 'fichesGlobal': return '📋 Fiches Complétées (TOUS)';
      case 'factures': return '💰 Factures';
      case 'stock': return '📦 Stock';
      case 'commandes': return '🛒 Commandes';
      case 'conges': return '🏖️ Congés';
      case 'reclamations': return '⚠️ Remontées Terrain';
      default: return 'ESSAN Dashboard';
    }
  }

  // ==================== LOGOUT ====================

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}