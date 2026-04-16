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
import { FicheInterventionManager } from '../fiche-intervention-manager/fiche-intervention-manager';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Planning } from '../planning/planning';
import { Semenier } from '../semenier/semenier';
import { Documents } from '../documents/documents';
import { MiseAuTravail } from '../mise-au-travail/mise-au-travail';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';

@Component({
  selector: 'app-dashboard-kia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, FichesCompletees,
    Planning, Semenier, Documents,
    MiseAuTravail, RemonteesTerrainComponent
  ],
  templateUrl: './dashboard-kia.html',
  styleUrl: './dashboard-kia.css'
})
export class DashboardKia implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this.fermerDetailReclamation();
    this._currentPage = value;
  }

  showCongeForm = false;
  showDetailModal = false;
  showReclamationDetailModal = false;

  congesTechniciens: any[] = [];
  mesConges: any[] = [];
  employes: any[] = [];
  reclamations: any[] = [];
  interventions: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;
  selectedReclamation: any = null;
  soldeConges: any = null;

  conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '' };
  nombreJours = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadReclamations();
    this.loadInterventions();
    this.loadFiches();
    this.loadSoldeConges();
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe(data => {
      this.congesTechniciens = data.filter((c: any) => c.utilisateur?.role === 'TECHNICIEN');
      this.mesConges = data.filter(c => c.utilisateur?.id === this.user.id);
    }, error => { this.congesTechniciens = []; this.mesConges = []; });
  }

  loadSoldeConges() {
    if (!this.user.id) return;
    this.http.get<any>(`http://localhost:8080/api/conges/solde/${this.user.id}`).subscribe({
      next: (data) => this.soldeConges = data,
      error: () => this.soldeConges = null
    });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadReclamations() {
    this.http.get<any[]>('http://localhost:8080/api/reclamations-sse').subscribe({
      next: (data) => this.reclamations = data,
      error: () => {
        const stored = localStorage.getItem('reclamations');
        this.reclamations = stored ? JSON.parse(stored) : [];
      }
    });
  }

  loadInterventions() {
    const stored = localStorage.getItem('interventions');
    this.interventions = stored ? JSON.parse(stored) : [];
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    const all = stored ? JSON.parse(stored) : [];
    this.fiches = all.filter((f: any) => f.technicienId !== this.user.id);
  }

  deposerConge() {
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
      this.loadConges();
      this.loadSoldeConges();
      this.showCongeForm = false;
      this.resetCongeForm();
    }, error => console.error('Erreur', error));
  }

  calculerNombreJours() {
    if (this.conge.dateDebut && this.conge.dateFin) {
      this.nombreJours = this.calculerJours(this.conge.dateDebut, this.conge.dateFin);
    } else {
      this.nombreJours = 0;
    }
  }

  calculerJours(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return 0;
    return Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  resetCongeForm() {
    this.conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '' };
    this.nombreJours = 0;
  }

  updateStatutConge(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges(), error => console.error('Erreur', error));
  }

  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }
  ouvrirDetailReclamation(rec: any) { this.selectedReclamation = rec; this.showReclamationDetailModal = true; }
  fermerDetailReclamation() { this.showReclamationDetailModal = false; this.selectedReclamation = null; }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches Intervention';
      case 'fiches-completees': return 'Fiches Completees';
      case 'planning': return 'Planning';
      case 'semenier': return 'Semenier';
      case 'ged': return 'Documents';
      case 'conges-tech': return 'Conges a Valider';
      case 'mes-conges': return 'Mes Conges';
      case 'remonteesTerrain': return 'Remontees Terrain';
      case 'mise-au-travail': return 'Fiches Mise au Travail';
      default: return 'KIA Dashboard';
    }
  }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}