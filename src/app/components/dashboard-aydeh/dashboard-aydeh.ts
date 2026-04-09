import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-aydeh',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-aydeh.html',
  styleUrl: './dashboard-aydeh.css'
})
export class DashboardAydeh implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

  factures: any[] = [];
  budgets: any[] = [];
  servicesGeneraux: any[] = [];
  showFormBudget = false;
  showFormService = false;

  nouveauBudget = {
    intitule: '', montantAlloue: '', montantDepense: '',
    periode: '', statut: 'En cours', categorie: ''
  };

  nouveauService = {
    intitule: '', fournisseur: '', montant: '',
    dateEcheance: '', statut: 'Actif', type: ''
  };

  categoriesBudget = ['IT', 'RH', 'Commercial', 'Operations', 'Marketing', 'Infrastructure'];
  typesService = ['Loyer', 'Electricite', 'Internet', 'Telephone', 'Nettoyage', 'Securite', 'Autre'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadFactures();
    this.loadBudgets();
    this.loadServicesGeneraux();
  }

  loadFactures() {
    this.http.get<any[]>('http://localhost:8080/api/factures').subscribe({
      next: (data) => this.factures = data,
      error: () => this.factures = []
    });
  }

  loadBudgets() {
    const stored = localStorage.getItem('mcl_budgets');
    this.budgets = stored ? JSON.parse(stored) : [
      { id: 1, intitule: 'Budget IT', montantAlloue: 50000, montantDepense: 32000, periode: '2026', statut: 'En cours', categorie: 'IT' },
      { id: 2, intitule: 'Budget RH', montantAlloue: 120000, montantDepense: 89000, periode: '2026', statut: 'En cours', categorie: 'RH' },
      { id: 3, intitule: 'Budget Commercial', montantAlloue: 30000, montantDepense: 28500, periode: '2026', statut: 'Alerte', categorie: 'Commercial' }
    ];
  }

  loadServicesGeneraux() {
    const stored = localStorage.getItem('mcl_services_generaux');
    this.servicesGeneraux = stored ? JSON.parse(stored) : [
      { id: 1, intitule: 'Loyer Bureau', fournisseur: 'SCI Immo', montant: 3500, dateEcheance: '2026-12-31', statut: 'Actif', type: 'Loyer' },
      { id: 2, intitule: 'Abonnement Internet', fournisseur: 'Orange Pro', montant: 150, dateEcheance: '2026-06-30', statut: 'Actif', type: 'Internet' },
      { id: 3, intitule: 'Nettoyage Bureaux', fournisseur: 'CleanPro', montant: 800, dateEcheance: '2026-12-31', statut: 'Actif', type: 'Nettoyage' }
    ];
  }

  ajouterBudget() {
    if (!this.nouveauBudget.intitule) { alert('Champ obligatoire manquant'); return; }
    const id = Math.max(...this.budgets.map((b: any) => b.id || 0), 0) + 1;
    this.budgets.push({ id, ...this.nouveauBudget });
    localStorage.setItem('mcl_budgets', JSON.stringify(this.budgets));
    this.nouveauBudget = { intitule: '', montantAlloue: '', montantDepense: '', periode: '', statut: 'En cours', categorie: '' };
    this.showFormBudget = false;
  }

  ajouterService() {
    if (!this.nouveauService.intitule) { alert('Champ obligatoire manquant'); return; }
    const id = Math.max(...this.servicesGeneraux.map((s: any) => s.id || 0), 0) + 1;
    this.servicesGeneraux.push({ id, ...this.nouveauService });
    localStorage.setItem('mcl_services_generaux', JSON.stringify(this.servicesGeneraux));
    this.nouveauService = { intitule: '', fournisseur: '', montant: '', dateEcheance: '', statut: 'Actif', type: '' };
    this.showFormService = false;
  }

  supprimerBudget(id: number) {
    if (confirm('Supprimer ?')) {
      this.budgets = this.budgets.filter((b: any) => b.id !== id);
      localStorage.setItem('mcl_budgets', JSON.stringify(this.budgets));
    }
  }

  supprimerService(id: number) {
    if (confirm('Supprimer ?')) {
      this.servicesGeneraux = this.servicesGeneraux.filter((s: any) => s.id !== id);
      localStorage.setItem('mcl_services_generaux', JSON.stringify(this.servicesGeneraux));
    }
  }

  getPourcentageBudget(b: any): number {
    if (!b.montantAlloue) return 0;
    return Math.round((b.montantDepense / b.montantAlloue) * 100);
  }

  getBudgetColor(pct: number): string {
    if (pct >= 90) return '#c62828';
    if (pct >= 70) return '#f57f17';
    return '#2e7d32';
  }

  get totalFactures() { return this.factures.length; }
  get facturesEnAttente() { return this.factures.filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'ENVOYEE').length; }
  get totalBudgetAlloue() { return this.budgets.reduce((s, b) => s + (parseFloat(b.montantAlloue) || 0), 0); }
  get totalBudgetDepense() { return this.budgets.reduce((s, b) => s + (parseFloat(b.montantDepense) || 0), 0); }

  getPageTitle(): string {
    const map: any = {
      'home': 'Tableau de Bord DAF',
      'comptabilite': 'Comptabilite & Factures',
      'budget': 'Budget & Finance',
      'services': 'Services Generaux'
    };
    return map[this.currentPage] || 'DAF';
  }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}