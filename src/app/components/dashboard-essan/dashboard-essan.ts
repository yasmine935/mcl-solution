import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Taches } from '../taches/taches';
import { GestionClients } from '../clients/clients';
import { Planning } from '../planning/planning';
import { Semainier } from '../semenier/semenier';
import { Documents } from '../documents/documents';
import { Factures } from '../factures/factures';
import { Conges } from '../conges/conges';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';

@Component({
  selector: 'app-dashboard-essan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    FicheInterventionManager, FichesCompletees, Taches, GestionClients,
    Planning, Semainier, Documents, Factures, Conges,
    ApprovisionnementComponent, RemonteesTerrainComponent
  ],
  templateUrl: './dashboard-essan.html',
  styleUrl: './dashboard-essan.css'
})
export class DashboardEssan implements OnInit {
  user: any = {};
  sidebarOpen = false;
  currentPage = 'dashboard';

  // Stats dashboard
  totalFiches = 0;
  totalFactures = 0;
  totalCommandes = 0;
  totalReclamations = 0;
  totalConges = 0;
  montantTotalFactures = 0;

  // Stock & Commandes (pas de composant standalone)
  stock: any[] = [];
  commandes: any[] = [];
  employes: any[] = [];

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.user.role !== 'ESSAN') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStats();
  }

  loadStats() {
    this.http.get<any[]>('http://localhost:8080/api/fiches-intervention').subscribe({
      next: (d) => this.totalFiches = d.length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/factures').subscribe({
      next: (d) => {
        this.totalFactures = d.length;
        this.montantTotalFactures = d.reduce((s: number, f: any) =>
          s + (Number.parseFloat(f.montantHT) * (1 + Number.parseFloat(f.tva) / 100) || 0), 0);
      }, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/commandes').subscribe({
      next: (d) => { this.commandes = d; this.totalCommandes = d.length; }, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
      next: (d) => this.totalReclamations = d.length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (d) => this.totalConges = d.filter((c: any) => c.statut === 'EN_ATTENTE').length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/stock').subscribe({
      next: (d) => this.stock = d, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (d) => this.employes = d, error: () => {}
    });
  }

  getTotalStockValue(): number {
    return this.stock.reduce((s: number, i: any) =>
      s + (Number.parseFloat(i.quantite) * Number.parseFloat(i.prixUnitaire) || 0), 0);
  }

  getPageTitle(): string {
    const titles: Record<string, string> = {
      'dashboard': '📊 Dashboard Propriétaire',
      'fiches': '🔧 Fiches d\'Intervention',
      'fiches-completees': '✅ Fiches Complétées',
      'projets': '📊 Gestion des Projets',
      'clients': '👥 Gestion des Clients',
      'planning': '📅 Planning',
      'semainier': '📆 Semainier',
      'documents': '📁 Documents',
      'factures': '💰 Factures',
      'approvisionnement': '📋 Approvisionnement',
      'stock': '📦 Stock',
      'commandes': '🛒 Commandes',
      'conges': '🏖️ Congés',
      'remontees': '⚠️ Remontées Terrain',
      'employes': '👷 Employés'
    };
    return titles[this.currentPage] || 'ESSAN';
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }
  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}
