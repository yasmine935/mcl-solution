import { libelleRole } from '../../services/roles';
import { COULEURS_STATUT_PROJET, STATUTS_PROJET, compterParStatutProjet } from '../../services/statuts-projet';
import { Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Taches } from '../taches/taches';
import { GestionClients } from '../clients/clients';
import { Planning } from '../planning/planning';
import { Documents } from '../documents/documents';
import { Conges } from '../conges/conges';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import {
  CommandesApi, CongesApi, FichesInterventionApi, ReclamationsApi,
  StockApi, TachesApi, UtilisateursApi
} from '../../services/api/apis';

const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Espace Propriétaire',
  roleLabel: '⭐ Propriétaire',
  badge: '⭐ DIRECTION',
  items: [
    { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', section: 'Général' },
    { key: 'fiches', icon: 'description', label: 'Fiches d\'Intervention', section: 'Interventions' },
    { key: 'fiches-completees', icon: 'check_circle', label: 'Fiches Complétées' },
    { key: 'projets', icon: 'task_alt', label: 'Projets', section: 'Gestion' },
    { key: 'projets-realises', icon: 'done_all', label: 'Projets Réalisés' },
    { key: 'clients', icon: 'people', label: 'Clients' },
    { key: 'planning', icon: 'calendar_month', label: 'Planning' },
    { key: 'documents', icon: 'folder_open', label: 'Documents' },
    { key: 'approvisionnement', icon: 'assignment', label: 'Approvisionnement', section: 'Finances' },
    { key: 'conges', icon: 'beach_access', label: 'Congés', section: 'RH & Terrain' },
    { key: 'remontees', icon: 'report_problem', label: 'Remontées Terrain' },
    { key: 'employes', icon: 'badge', label: 'Employés' }
  ],
  gradient: 'linear-gradient(180deg, #020c1b 0%, #0a1628 50%, #071020 100%)',
  accent: '#5e35b1',
  accentSoft: '#ede7f6',
  tag: '#ce93d8'
};

@Component({
  selector: 'app-dashboard-essan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    NgApexchartsModule, DashboardLayout,
    FicheInterventionManager, FichesCompletees, Taches, GestionClients,
    Planning, Documents, Conges,
    ApprovisionnementComponent, RemonteesTerrainComponent
  ],
  templateUrl: './dashboard-essan.html',
  styleUrl: './dashboard-essan.css'
})
export class DashboardEssan implements OnInit {
  espace = ESPACE;
  /** Libellé affiché d'un rôle (ex. TECHNICIEN_SUP → Directeur des opérations). */
  readonly libelleRole = libelleRole;
  user: any = {};

  private _currentPage = 'dashboard';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.ficheStatutCible = '';
    this.projetStatutCible = '';
    this._currentPage = value;
  }

  /** Statuts pré-filtrés à l'ouverture des listes (clic sur un donut). */
  ficheStatutCible = '';
  projetStatutCible = '';
  private readonly zone = inject(NgZone);

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

  /** Ordre identique aux labels du donut « Statut des interventions ». */
  private readonly statutsFichesDonut = ['EN_COURS', 'COMPLETEE', 'VALIDEE'];

  // Clic sur une part ou sur la légende → liste des fiches filtrée sur ce statut.
  // ApexCharts tourne hors de la zone Angular : on y revient pour la navigation.
  readonly chartDonutFichesChart = {
    ...this.chartDonutOptions.chart,
    events: {
      dataPointSelection: (_e: any, _ctx: any, cfg: any) => this.ouvrirFichesStatut(cfg.dataPointIndex),
      legendClick: (_ctx: any, seriesIndex: number) => this.ouvrirFichesStatut(seriesIndex)
    }
  };

  private ouvrirFichesStatut(index: number) {
    const statut = this.statutsFichesDonut[index];
    if (!statut) return;
    this.zone.run(() => {
      this.currentPage = 'fiches';
      this.ficheStatutCible = statut;
    });
  }

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

  /** Statuts actuels des projets (anciens codes en base regroupés, cf. statuts-projet.ts). */
  readonly statutsProjet = STATUTS_PROJET;
  readonly couleursStatutsProjet = STATUTS_PROJET.map(s => COULEURS_STATUT_PROJET[s]);

  // Clic sur le donut « Statut des projets » → même page que le menu, filtrée.
  // « Réalisé » a sa propre page (Projets Réalisés), exclue de la page Projets.
  readonly chartDonutProjetsChart = {
    ...this.chartDonutOptions.chart,
    events: {
      dataPointSelection: (_e: any, _ctx: any, cfg: any) => this.ouvrirProjetsStatut(cfg.dataPointIndex),
      legendClick: (_ctx: any, seriesIndex: number) => this.ouvrirProjetsStatut(seriesIndex)
    }
  };

  private ouvrirProjetsStatut(index: number) {
    const statut = STATUTS_PROJET[index];
    if (!statut) return;
    this.zone.run(() => {
      if (statut === 'Réalisé') {
        this.currentPage = 'projets-realises';
      } else {
        this.currentPage = 'projets';
        this.projetStatutCible = statut;
      }
    });
  }

  get chartTachesStatutSeries(): number[] {
    return compterParStatutProjet(this.taches);
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

  constructor(
    private readonly router: Router,
    private readonly fichesInterventionApi: FichesInterventionApi,
    private readonly commandesApi: CommandesApi,
    private readonly reclamationsApi: ReclamationsApi,
    private readonly congesApi: CongesApi,
    private readonly stockApi: StockApi,
    private readonly utilisateursApi: UtilisateursApi,
    private readonly tachesApi: TachesApi
  ) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['DIRECTION', 'ADMINISTRATEUR'].includes(this.user.role)) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStats();
  }

  loadStats() {
    this.fichesInterventionApi.lister().subscribe({
      next: (d) => { this.fiches = d; this.totalFiches = d.length; }, error: () => {}
    });
    this.commandesApi.lister().subscribe({
      next: (d) => { this.commandes = d; this.totalCommandes = d.length; }, error: () => {}
    });
    this.reclamationsApi.lister().subscribe({
      next: (d) => this.totalReclamations = d.length, error: () => {}
    });
    this.congesApi.lister().subscribe({
      next: (d) => { this.congesAllData = d; this.totalConges = d.filter((c: any) => c.statut === 'EN_ATTENTE').length; }, error: () => {}
    });
    this.stockApi.lister().subscribe({
      next: (d) => this.stock = d, error: () => {}
    });
    this.utilisateursApi.lister().subscribe({
      next: (d) => this.employes = d, error: () => {}
    });
    this.tachesApi.lister().subscribe({
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
      'projets-realises': '✅ Projets Réalisés',
      'clients': '👥 Gestion des Clients',
      'planning': '📅 Planning',
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
      'MANAGER': '#1b5e20', 'ADMINISTRATEUR': '#37474f',
      'DIRECTION': '#5e35b1', 'RH': '#880e4f',
      'ADMINISTRATIF': '#e65100', 'COMPTABILITE': '#2e7d32', 'SUPPLY_CHAIN': '#00695c'
    };
    return colors[role] || '#546e7a';
  }

  getRoleColorLight(role: string): string {
    const colors: Record<string, string> = {
      'TECHNICIEN': '#e3f2fd', 'TECHNICIEN_SUP': '#ede7f6',
      'MANAGER': '#e8f5e9', 'ADMINISTRATEUR': '#eceff1',
      'DIRECTION': '#ede7f6', 'RH': '#fce4ec',
      'ADMINISTRATIF': '#fff3e0', 'COMPTABILITE': '#e8f5e9', 'SUPPLY_CHAIN': '#e0f2f1'
    };
    return colors[role] || '#f5f5f5';
  }

  ouvrirDetail(e: any) { this.selectedEmploye = e; this.showEmployeDetail = true; }
  fermerDetail() { this.showEmployeDetail = false; this.selectedEmploye = null; }
}
