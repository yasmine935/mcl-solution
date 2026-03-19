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
  selector: 'app-dashboard-aurelien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule
  ],
  templateUrl: './dashboard-aurelien.html',
  styleUrl: './dashboard-aurelien.css'
})
export class DashboardAurelien implements OnInit {
  user: any = {};
  currentPage = 'home';
  showCongeForm = false;

  interventions: any[] = [];
  conges: any[] = [];
  tousLesConges: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  employes: any[] = [];

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
      case 'mes-conges': return 'Mes Congés';
      case 'conges-valider': return 'Congés à Valider';
      default: return 'Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}