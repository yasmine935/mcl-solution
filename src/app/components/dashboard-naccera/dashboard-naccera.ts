import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-naccera',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-naccera.html',
  styleUrl: './dashboard-naccera.css'
})
export class DashboardNaccera implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

  factures: any[] = [];
  ecritures: any[] = [];
  showFormEcriture = false;

  nouvelleEcriture = {
    date: '', libelle: '', debit: '', credit: '',
    compte: '', journal: 'Achats'
  };

  journals = ['Achats', 'Ventes', 'Banque', 'Caisse', 'Operations Diverses'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadFactures();
    this.loadEcritures();
  }

  loadFactures() {
    this.http.get<any[]>('http://localhost:8080/api/factures').subscribe({
      next: (data) => this.factures = data,
      error: () => this.factures = []
    });
  }

  loadEcritures() {
    const stored = localStorage.getItem('mcl_ecritures');
    this.ecritures = stored ? JSON.parse(stored) : [
      { id: 1, date: '2026-04-01', libelle: 'Facture client MCL-001', debit: 5000, credit: 0, compte: '411000', journal: 'Ventes' },
      { id: 2, date: '2026-04-02', libelle: 'Achat materiel IT', debit: 0, credit: 1200, compte: '606100', journal: 'Achats' },
      { id: 3, date: '2026-04-05', libelle: 'Loyer bureaux avril', debit: 0, credit: 3500, compte: '613100', journal: 'Banque' }
    ];
  }

  ajouterEcriture() {
    if (!this.nouvelleEcriture.libelle || !this.nouvelleEcriture.date) {
      alert('Champs obligatoires manquants');
      return;
    }
    const id = Math.max(...this.ecritures.map((e: any) => e.id || 0), 0) + 1;
    this.ecritures.push({ id, ...this.nouvelleEcriture });
    localStorage.setItem('mcl_ecritures', JSON.stringify(this.ecritures));
    this.nouvelleEcriture = { date: '', libelle: '', debit: '', credit: '', compte: '', journal: 'Achats' };
    this.showFormEcriture = false;
  }

  supprimerEcriture(id: number) {
    if (confirm('Supprimer cette ecriture ?')) {
      this.ecritures = this.ecritures.filter((e: any) => e.id !== id);
      localStorage.setItem('mcl_ecritures', JSON.stringify(this.ecritures));
    }
  }

  get totalDebit() { return this.ecritures.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0); }
  get totalCredit() { return this.ecritures.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0); }
  get solde() { return this.totalDebit - this.totalCredit; }
  get facturesPayees() { return this.factures.filter(f => f.statut === 'PAYEE').length; }
  get facturesEnAttente() { return this.factures.filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'ENVOYEE').length; }

  getPageTitle(): string {
    const map: any = {
      'home': 'Tableau de Bord Comptabilite',
      'ecritures': 'Journal Comptable',
      'factures': 'Factures & Paiements'
    };
    return map[this.currentPage] || 'Comptabilite';
  }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}