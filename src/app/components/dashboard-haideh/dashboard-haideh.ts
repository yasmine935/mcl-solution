import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';

const ESPACE: EspaceConfig = {
  brand: 'MCL Groupe',
  sousTitre: 'Direction Administrative',
  roleLabel: 'DAF',
  badge: 'DAF',
  items: [
    { key: 'home', icon: 'dashboard', label: 'Accueil', section: 'Tableau de Bord' },
    { key: 'budget', icon: 'account_balance', label: 'Budget & Finance', section: 'Finance' },
    { key: 'services', icon: 'business', label: 'Services Generaux' }
  ],
  gradient: 'linear-gradient(180deg, #1a3c34 0%, #2d6a4f 50%, #40916c 100%)',
  accent: '#2d6a4f',
  accentSoft: '#d8f3dc',
  tag: '#b7e4c7'
};

@Component({
  selector: 'app-dashboard-haideh',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, DashboardLayout],
  templateUrl: './dashboard-haideh.html',
  styleUrl: './dashboard-haideh.css'
})
export class DashboardHaideh implements OnInit {
  espace = ESPACE;
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadBudgets();
    this.loadServicesGeneraux();
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

  get totalBudgetAlloue() { return this.budgets.reduce((s, b) => s + (parseFloat(b.montantAlloue) || 0), 0); }
  get totalBudgetDepense() { return this.budgets.reduce((s, b) => s + (parseFloat(b.montantDepense) || 0), 0); }

  getPageTitle(): string {
    const map: any = {
      'home': 'Tableau de Bord DAF',
      'budget': 'Budget & Finance',
      'services': 'Services Generaux'
    };
    return map[this.currentPage] || 'DAF';
  }
}
