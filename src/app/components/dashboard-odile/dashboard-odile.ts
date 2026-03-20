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

@Component({
  selector: 'app-dashboard-odile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule
  ],
  templateUrl: './dashboard-odile.html',
  styleUrl: './dashboard-odile.css'
})
export class DashboardOdile implements OnInit {
  user: any = {};
  
  private _currentPage = 'home';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.fermerDetailReclamation();
    this._currentPage = value;
  }

  showCongeForm = false;
  showReclamationDetailModal = false;
  selectedReclamation: any = null;

  tousLesConges: any[] = [];
  conges: any[] = [];
  employes: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  factures: any[] = [];
  reclamations: any[] = [];

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
    this.loadFactures();
    this.loadReclamations();
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => {
        this.tousLesConges = data;
        this.conges = data.filter(c => c.utilisateur?.id === this.user.id);
      }, error => {
        this.tousLesConges = [];
        this.conges = [];
      });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadReclamations() {
    const stored = localStorage.getItem('reclamations');
    const toutesReclamations = stored ? JSON.parse(stored) : [];
    // Odile voit TOUTES les réclamations
    this.reclamations = toutesReclamations;
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Archive 2025', date: '2025-12-31', type: 'PDF' },
      { id: 2, nom: 'Rapport Annuel 2025', date: '2025-12-20', type: 'PDF' },
      { id: 3, nom: 'Directives Entreprise', date: '2025-12-01', type: 'DOCX' },
      { id: 4, nom: 'Contrats Clients', date: '2025-11-15', type: 'PDF' },
      { id: 5, nom: 'Politique RH', date: '2025-10-01', type: 'DOCX' }
    ];
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Problème critique', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-18' },
      { id: 2, titre: 'Amélioration système', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-15' },
      { id: 3, titre: 'Migration serveur', statut: 'EN_COURS', priorite: 'HAUTE', date: '2026-01-16' },
      { id: 4, titre: 'Sécurité données', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-17' },
      { id: 5, titre: 'Sauvegarde disque', statut: 'FERME', priorite: 'MOYENNE', date: '2026-01-10' }
    ];
  }

  loadFactures() {
    this.factures = [
      { id: 1, numero: 'FAC-2026-001', client: 'Client A', montant: '5000€', date: '2026-01-15', statut: 'PAYEE' },
      { id: 2, numero: 'FAC-2026-002', client: 'Client B', montant: '3500€', date: '2026-01-12', statut: 'EN_ATTENTE' },
      { id: 3, numero: 'FAC-2026-003', client: 'Client C', montant: '7200€', date: '2026-01-10', statut: 'PAYEE' },
      { id: 4, numero: 'FAC-2026-004', client: 'Client D', montant: '4100€', date: '2026-01-08', statut: 'EN_ATTENTE' },
      { id: 5, numero: 'FAC-2026-005', client: 'Client E', montant: '2800€', date: '2026-01-05', statut: 'PAYEE' }
    ];
  }

  deposerConge() {
    const demande = {
      ...this.conge,
      utilisateur: { id: this.user.id }
    };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur', error));
  }

  updateStatut(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges(), error => console.error('Erreur', error));
  }

  ouvrirDetailReclamation(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.showReclamationDetailModal = true;
  }

  fermerDetailReclamation() {
    this.showReclamationDetailModal = false;
    this.selectedReclamation = null;
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Tableau de Bord';
      case 'interventions': return 'Interventions';
      case 'ged': return 'GED';
      case 'tickets': return 'Tickets';
      case 'rh': return 'Ressources Humaines';
      case 'factures': return 'Factures';
      case 'conges-valider': return 'Congés à Valider';
      case 'mes-conges': return 'Mes Congés';
      case 'remonteesTerrain': return 'Remontées Terrain';
      default: return 'Odile Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}