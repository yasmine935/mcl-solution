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
import { Taches } from '../taches/taches';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Factures } from '../factures/factures';
import { Documents } from '../documents/documents';
import { Semenier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';

@Component({
  selector: 'app-dashboard-aurelien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, Taches, FichesCompletees,
    Factures, Documents, Semenier, Planning, TicketingComponent
  ],
  templateUrl: './dashboard-aurelien.html',
  styleUrl: './dashboard-aurelien.css'
})
export class DashboardAurelien implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this._currentPage = value;
  }

  showCongeForm = false;
  showDetailModal = false;

  interventions: any[] = [];
  conges: any[] = [];
  documents: any[] = [];
  employes: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;

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
    this.loadDocuments();
    this.loadFiches();
    this.loadSoldeConges();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Rapport Intervention Jan 2026', date: '2026-01-15', type: 'PDF' },
      { id: 2, nom: 'Devis Client MCL', date: '2026-01-10', type: 'DOCX' },
      { id: 3, nom: 'Manuel Technique Cameras', date: '2025-12-20', type: 'PDF' },
      { id: 4, nom: 'Contrats Clients', date: '2025-12-15', type: 'PDF' },
      { id: 5, nom: 'PV de Reunion', date: '2026-01-08', type: 'DOCX' }
    ];
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
  }

  deposerConge() {
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
      this.loadConges();
      this.showCongeForm = false;
      this.resetCongeForm(); 
      this.loadSoldeConges();
    }, error => console.error('Erreur envoi conge', error));
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
soldeConges: any = null;

loadSoldeConges() {
  if (!this.user.id) return;
  this.http.get<any>(`http://localhost:8080/api/conges/solde/${this.user.id}`).subscribe({
    next: (data) => this.soldeConges = data,
    error: () => this.soldeConges = null ,
    
  });
}
  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches Intervention';
      case 'fiches-completees': return 'Fiches Completees';
      case 'taches': return 'Taches';
      case 'planning': return 'Planning';
      case 'ged': return 'Documents';
      case 'semenier': return 'Semenier';
      case 'tickets': return 'Tickets Clients';
      case 'factures': return 'Factures';
      case 'mes-conges': return 'Mes Conges';
      default: return 'Dashboard';
    }
  }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}