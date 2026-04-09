import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { Voitures } from '../voitures/voitures';

@Component({
  selector: 'app-dashboard-karine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, RemonteesTerrainComponent, Voitures],
  templateUrl: './dashboard-karine.html',
  styleUrl: './dashboard-karine.css'
})
export class DashboardKarine implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

  // Données
  conges: any[] = [];
  employes: any[] = [];
  reclamationsSSE: any[] = [];
  voitures: any[] = [];
  showFormVoiture = false;
  showDetailConge: any = null;

 nouvelleVoiture = {
  immatriculation: '', marque: '', modele: '',
  annee: '', kilometrage: '', statut: 'Disponible',
  conducteur: '', prochainControle: ''  // ← sans accent
};
  statutsVoiture = ['Disponible', 'En service', 'En maintenance', 'Hors service'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadSSE();
    this.loadVoitures();
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (data) => this.conges = data,
      error: () => this.conges = []
    });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => this.employes = data,
      error: () => this.employes = []
    });
  }

  loadSSE() {
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
      next: (data) => this.reclamationsSSE = data,
      error: () => this.reclamationsSSE = []
    });
  }

  loadVoitures() {
    const stored = localStorage.getItem('mcl_voitures');
    this.voitures = stored ? JSON.parse(stored) : [
      { id: 1, immatriculation: 'AB-123-CD', marque: 'Renault', modele: 'Kangoo', annee: '2021', kilometrage: '45000', statut: 'En service', conducteur: 'Test Technicien', prochainControle: '2026-06-01' },
      { id: 2, immatriculation: 'EF-456-GH', marque: 'Peugeot', modele: 'Partner', annee: '2020', kilometrage: '62000', statut: 'Disponible', conducteur: '', prochainControle: '2026-09-15' }
    ];
  }

  saveVoitures() {
    localStorage.setItem('mcl_voitures', JSON.stringify(this.voitures));
  }

  ajouterVoiture() {
    if (!this.nouvelleVoiture.immatriculation || !this.nouvelleVoiture.marque) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const id = Math.max(...this.voitures.map((v: any) => v.id || 0), 0) + 1;
    this.voitures.push({ id, ...this.nouvelleVoiture });
    this.saveVoitures();
    this.resetFormVoiture();
    this.showFormVoiture = false;
  }

  supprimerVoiture(id: number) {
    if (confirm('Supprimer ce véhicule ?')) {
      this.voitures = this.voitures.filter((v: any) => v.id !== id);
      this.saveVoitures();
    }
  }

  resetFormVoiture() {
    this.nouvelleVoiture = {
      immatriculation: '', marque: '', modele: '',
      annee: '', kilometrage: '', statut: 'Disponible',
      conducteur: '', prochainControle: ''  // ← sans accent
    };
  }

  updateStatutConge(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges());
  }

  getStatutVoitureColor(statut: string): string {
    const map: any = {
      'Disponible': '#2e7d32', 'En service': '#1565c0',
      'En maintenance': '#f57f17', 'Hors service': '#c62828'
    };
    return map[statut] || '#546e7a';
  }

  get congesEnAttente() { return this.conges.filter(c => c.statut === 'EN_ATTENTE'); }
  get congesApprouves() { return this.conges.filter(c => c.statut === 'APPROUVE'); }
  get sseEnAttente() { return this.reclamationsSSE.filter(r => r.statut === 'EN_ATTENTE'); }
  get voituresDisponibles() { return this.voitures.filter((v: any) => v.statut === 'Disponible'); }

  getPageTitle(): string {
    const map: any = {
      'home': 'Tableau de Bord DRH',
      'conges': 'Gestion des Congés',
      'sse': 'Remontées SSE Terrain',
      'voitures': 'Parc Automobile',
      'employes': 'Dossiers du Personnel'
    };
    return map[this.currentPage] || 'DRH';
  }
getRoleColor(role: string): string {
  const map: any = {
    'FERID': '#1565c0', 'AURELIEN': '#283593', 'ODILE': '#0277bd',
    'TECHNICIEN_SUP': '#4527a0', 'TECHNICIEN': '#01579b',
    'ESSAN': '#5e35b1', 'KARINE': '#7b1c1c', 'AYDEH': '#4e342e',
    'NACCERA': '#880e4f', 'ABY': '#1a237e'
  };
  return map[role] || '#546e7a';
}
  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}