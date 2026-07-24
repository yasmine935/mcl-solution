import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Taches } from '../taches/taches';
import { GestionClients } from '../clients/clients';
import { Planning } from '../planning/planning';
import { Semainier } from '../semenier/semenier';
import { Documents } from '../documents/documents';
import { Conges } from '../conges/conges';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';

@Component({
  selector: 'app-dashboard-essan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    NgApexchartsModule,
    FicheInterventionManager, FichesCompletees, Taches, GestionClients,
    Planning, Semainier, Documents, Conges,
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
  totalCommandes = 0;
  totalReclamations = 0;
  totalConges = 0;

  // Données complètes pour les graphiques BI
  fiches: any[] = [];
  congesAllData: any[] = [];
  taches: any[] = [];

  // Stock & Commandes (pas de composant standalone)
  stock: any[] = [];
  commandes: any[] = [];
  employes: any[] = [];
  selectedEmploye: any = null;
  showEmployeDetail = false;

  readonly chartDonutOptions = {
    chart: { type: 'donut' as const, height: 220, fontFamily: 'Exo 2, sans-serif' },
    legend: { position: 'bottom' as const, fontSize: '12px' },
    dataLabels: { enabled: true },
    plotOptions: { pie: { donut: { size: '65%' } } }
  };

  readonly chartBarOptions = {
    chart: { type: 'bar' as const, height: 220, toolbar: { show: false }, fontFamily: 'Exo 2, sans-serif' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#f0f4f8' }
  };

  get chartFichesStatutSeries(): number[] {
    return [
      this.fiches.filter(f => f.statut === 'EN_COURS').length,
      this.fiches.filter(f => f.statut === 'COMPLETEE').length,
      this.fiches.filter(f => f.statut === 'VALIDEE').length
    ];
  }

  get chartCongesTypeSeries(): number[] {
    return ['ANNUEL', 'RTT', 'MALADIE', 'SANS_SOLDE', 'FORMATION']
      .map(t => this.congesAllData.filter((c: any) => c.type === t).length);
  }

  get chartFichesMoisSeries() {
    const now = new Date();
    const data = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return this.fiches.filter((f: any) => {
        const fd = new Date(f.dateCreation || f.date || '');
        return fd.getFullYear() === d.getFullYear() && fd.getMonth() === d.getMonth();
      }).length;
    });
    return [{ name: 'Interventions', data }];
  }

  get chartTachesStatutSeries(): number[] {
    const statuts = ['A_FAIRE', 'EN_COURS', 'TERMINEE', 'Perdu', 'En Attente'];
    return statuts.map(s => this.taches.filter((t: any) => t.statut === s).length);
  }

  get chartTachesPrioriteSeries(): number[] {
    return ['Élevé', 'Moyenne', 'Faible']
      .map(p => this.taches.filter((t: any) => t.priorite === p).length);
  }

  get chartFichesMoisCategories(): string[] {
    const moisFr = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return moisFr[d.getMonth()];
    });
  }

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
      next: (d) => { this.fiches = d; this.totalFiches = d.length; }, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/commandes').subscribe({
      next: (d) => { this.commandes = d; this.totalCommandes = d.length; }, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
      next: (d) => this.totalReclamations = d.length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (d) => { this.congesAllData = d; this.totalConges = d.filter((c: any) => c.statut === 'EN_ATTENTE').length; }, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/stock').subscribe({
      next: (d) => this.stock = d, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (d) => this.employes = d, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/taches').subscribe({
      next: (d) => this.taches = d, error: () => {}
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
      'approvisionnement': '📋 Approvisionnement',
      'stock': '📦 Stock',
      'commandes': '🛒 Commandes',
      'conges': '🏖️ Congés',
      'remontees': '⚠️ Remontées Terrain',
      'employes': '👷 Employés'
    };
    return titles[this.currentPage] || 'ESSAN';
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'TECHNICIEN': '#01579b', 'TECHNICIEN_SUP': '#4527a0',
      'AURELIEN': '#1b5e20', 'ODILE': '#0d47a1', 'KIA': '#bf360c',
      'FERID': '#37474f', 'ESSAN': '#5e35b1', 'KARINE': '#880e4f',
      'AYDEH': '#e65100', 'NACCERA': '#2e7d32', 'ABY': '#00695c'
    };
    return colors[role] || '#546e7a';
  }

  getRoleColorLight(role: string): string {
    const colors: Record<string, string> = {
      'TECHNICIEN': '#e3f2fd', 'TECHNICIEN_SUP': '#ede7f6',
      'AURELIEN': '#e8f5e9', 'ODILE': '#e3f2fd', 'KIA': '#fbe9e7',
      'FERID': '#eceff1', 'ESSAN': '#ede7f6', 'KARINE': '#fce4ec',
      'AYDEH': '#fff3e0', 'NACCERA': '#e8f5e9', 'ABY': '#e0f2f1'
    };
    return colors[role] || '#f5f5f5';
  }

  ouvrirDetail(e: any) { this.selectedEmploye = e; this.showEmployeDetail = true; }
  fermerDetail() { this.showEmployeDetail = false; this.selectedEmploye = null; }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }
  logout() { localStorage.removeItem('user'); this.router.navigate(['/login'], { replaceUrl: true }); }
}
