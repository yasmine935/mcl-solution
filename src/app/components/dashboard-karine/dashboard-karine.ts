import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { Voitures } from '../voitures/voitures';
import { Employes } from '../employes/employes';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';

const ESPACE: EspaceConfig = {
  brand: 'MCL Groupe',
  sousTitre: 'Direction des RH',
  roleLabel: 'DRH',
  badge: 'DRH',
  items: [
    { key: 'home', icon: 'dashboard', label: 'Accueil', section: 'Tableau de Bord' },
    { key: 'conges', icon: 'beach_access', label: 'Congés', section: 'RH & Personnel' },
    { key: 'employes', icon: 'people', label: 'Dossiers Personnel' },
    { key: 'reclamations', icon: 'report_problem', label: 'Remontées Terrain' },
    { key: 'voitures', icon: 'directions_car', label: 'Parc Automobile' }
  ],
  gradient: 'linear-gradient(180deg, #1e1b4b 0%, #4338ca 40%, #6366f1 100%)',
  accent: '#4338ca',
  accentSoft: '#e0e7ff',
  tag: 'rgba(255,255,255,0.9)'
};

@Component({
  selector: 'app-dashboard-karine',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, RemonteesTerrainComponent, Voitures, Employes, DashboardLayout],
  templateUrl: './dashboard-karine.html',
  styleUrl: './dashboard-karine.css'
})
export class DashboardKarine implements OnInit {
  espace = ESPACE;
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

  // Modal traiter congé
  showTraiterModal = false;
  congeSelectionne: any = null;
  noteTraitement = '';
  traitementSuccess = false;

 nouvelleVoiture = {
  immatriculation: '', marque: '', modele: '',
  annee: '', kilometrage: '', statut: 'Disponible',
  conducteur: '', prochainControle: ''  // ← sans accent
};
  statutsVoiture = ['Disponible', 'En service', 'En maintenance', 'Hors service'];

  constructor(private http: HttpClient) {}

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
  get congesTraites() { return this.conges.filter(c => c.statut === 'TRAITE'); }

  ouvrirTraiter(conge: any) {
    this.congeSelectionne = conge;
    this.noteTraitement = '';
    this.traitementSuccess = false;
    this.showTraiterModal = true;
  }

  fermerTraiter() {
    this.showTraiterModal = false;
    this.congeSelectionne = null;
    this.noteTraitement = '';
    this.traitementSuccess = false;
  }

  confirmerTraitement() {
    if (!this.congeSelectionne) return;
    this.http.put(`http://localhost:8080/api/conges/${this.congeSelectionne.id}/statut?statut=TRAITE`, {})
      .subscribe({
        next: () => {
          this.traitementSuccess = true;
          this.loadConges();
          setTimeout(() => this.fermerTraiter(), 1500);
        },
        error: () => {
          // Fallback local
          const idx = this.conges.findIndex(c => c.id === this.congeSelectionne.id);
          if (idx !== -1) this.conges[idx].statut = 'TRAITE';
          this.traitementSuccess = true;
          setTimeout(() => this.fermerTraiter(), 1500);
        }
      });
  }
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
    'ADMINISTRATEUR': '#1565c0', 'MANAGER': '#283593',
    'TECHNICIEN_SUP': '#4527a0', 'TECHNICIEN': '#01579b',
    'DIRECTION': '#5e35b1', 'RH': '#7b1c1c', 'ADMINISTRATIF': '#4e342e',
    'COMPTABILITE': '#880e4f', 'SUPPLY_CHAIN': '#1a237e'
  };
  return map[role] || '#546e7a';
}
}
