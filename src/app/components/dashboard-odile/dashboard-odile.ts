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
  currentPage = 'home';
  showCongeForm = false;

  interventions: any[] = [];
  conges: any[] = [];
  tousLesConges: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  employes: any[] = [];
  factures: any[] = [];

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadTousLesConges();
    this.loadDocuments();
    this.loadTickets();
    this.loadEmployes();
    this.loadFactures();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadTousLesConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => {
        this.tousLesConges = data.filter((c: any) => 
          c.utilisateur?.role === 'TECHNICIEN' || c.utilisateur?.role === 'TECHNICIEN_SUP'
        );
      }, error => this.tousLesConges = []);
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Rapport Complet 2026', date: '2026-01-15', type: 'PDF' },
      { id: 2, nom: 'Devis Clients', date: '2026-01-10', type: 'XLSX' },
      { id: 3, nom: 'Manuel Technique Complet', date: '2025-12-20', type: 'PDF' },
      { id: 4, nom: 'Contrats Signés', date: '2025-12-15', type: 'PDF' },
      { id: 5, nom: 'PV Réunions', date: '2026-01-08', type: 'DOCX' },
      { id: 6, nom: 'Directives RH', date: '2025-12-01', type: 'DOCX' }
    ];
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Problème critique système', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-18' },
      { id: 2, titre: 'Amélioration interface', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-15' },
      { id: 3, titre: 'Formation utilisateurs', statut: 'FERME', priorite: 'BASSE', date: '2026-01-10' },
      { id: 4, titre: 'Optimisation serveur', statut: 'EN_COURS', priorite: 'HAUTE', date: '2026-01-16' },
      { id: 5, titre: 'Sécurité données', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-17' }
    ];
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadFactures() {
    this.factures = [
      { id: 1, numero: 'FAC-2026-001', client: 'Client A', montant: '5000€', date: '2026-01-15', statut: 'PAYEE' },
      { id: 2, numero: 'FAC-2026-002', client: 'Client B', montant: '3500€', date: '2026-01-12', statut: 'EN_ATTENTE' },
      { id: 3, numero: 'FAC-2026-003', client: 'Client C', montant: '7200€', date: '2026-01-10', statut: 'PAYEE' },
      { id: 4, numero: 'FAC-2026-004', client: 'Client D', montant: '4100€', date: '2026-01-08', statut: 'EN_ATTENTE' },
      { id: 5, numero: 'FAC-2025-050', client: 'Client E', montant: '2800€', date: '2025-12-20', statut: 'PAYEE' }
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
      }, error => console.error('Erreur envoi congé', error));
  }

  updateStatut(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadTousLesConges(), error => console.error('Erreur statut', error));
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'interventions': return 'Gestion des Interventions';
      case 'ged': return 'GED - Gestion Électronique Documentaire';
      case 'tickets': return 'Tickets Support';
      case 'rh': return 'Ressources Humaines';
      case 'factures': return 'Gestion des Factures';
      case 'conges-valider': return 'Congés à Valider';
      case 'mes-conges': return 'Mes Congés';
      default: return 'Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}