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

@Component({
  selector: 'app-dashboard-aurelien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule ,FicheInterventionManager , Taches,FichesCompletees ,Factures , Documents , Semenier, Planning
  ],
  templateUrl: './dashboard-aurelien.html',
  styleUrl: './dashboard-aurelien.css'
})
export class DashboardAurelien implements OnInit {
  user: any = {};
  
  private _currentPage = 'home';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this._currentPage = value;
  }

  showCongeForm = false;
  showDetailModal = false;

  interventions: any[] = [];
  conges: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  employes: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadDocuments();
    this.loadTickets();
    this.loadFiches();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Rapport Intervention Jan 2026', date: '2026-01-15', type: 'PDF' },
      { id: 2, nom: 'Devis Client MCL', date: '2026-01-10', type: 'DOCX' },
      { id: 3, nom: 'Manuel Technique Caméras', date: '2025-12-20', type: 'PDF' },
      { id: 4, nom: 'Contrats Clients', date: '2025-12-15', type: 'PDF' },
      { id: 5, nom: 'PV de Réunion', date: '2026-01-08', type: 'DOCX' }
    ];
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Bug affichage dashboard', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-18' },
      { id: 2, titre: 'Feature export PDF demandée', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-15' },
      { id: 3, titre: 'Documentation manquante', statut: 'FERME', priorite: 'BASSE', date: '2026-01-10' },
      { id: 4, titre: 'Amélioration performance', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-16' }
    ];
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    const toutesLesInterventions = stored ? JSON.parse(stored) : [];
    this.fiches = toutesLesInterventions;
  }

  deposerConge() {
    const demande = {
      ...this.conge,
      utilisateur: { id: this.user.id },
      manager: { id: 4 } // Ferid
    };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur envoi congé', error));
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showDetailModal = true;
  }

  fermerDetailFiche() {
    this.showDetailModal = false;
    this.selectedFiche = null;
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches d\'Intervention';
      case 'interventions': return 'Gestion des Interventions';
     case 'ged': return '📄 Documents'; 
      case 'tickets': return 'Tickets Support';
      case 'rh': return 'Ressources Humaines';
      case 'mes-conges': return 'Mes Congés';
      default: return 'Dashboard';
      case 'fiches-completees': return '✅ Fiches Complétées';
case 'taches': return '✓ Tâches';
case 'factures': return '💰 Factures';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}