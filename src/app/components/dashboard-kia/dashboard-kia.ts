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

@Component({
  selector: 'app-dashboard-kia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule ,FicheInterventionManager
  ],
  templateUrl: './dashboard-kia.html',
  styleUrl: './dashboard-kia.css'
})
export class DashboardKia implements OnInit {
  user: any = {};
  
  private _currentPage = 'home';
  get currentPage(): string {
    return this._currentPage;
  }
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

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

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
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => {
        this.congesTechniciens = data.filter((c: any) => 
          c.utilisateur?.role === 'TECHNICIEN' && c.manager?.id === this.user.id
        );
        
        this.mesConges = data.filter(c => c.utilisateur?.id === this.user.id);
      }, error => {
        this.congesTechniciens = [];
        this.mesConges = [];
      });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadReclamations() {
    const stored = localStorage.getItem('reclamations');
    const toutesReclamations = stored ? JSON.parse(stored) : [];
    this.reclamations = toutesReclamations.filter((r: any) => 
      r.technicienId !== this.user.id
    );
  }

  loadInterventions() {
    const stored = localStorage.getItem('interventions');
    const allInterventions = stored ? JSON.parse(stored) : [];
    this.interventions = allInterventions;
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    const toutesLesInterventions = stored ? JSON.parse(stored) : [];
    this.fiches = toutesLesInterventions.filter((f: any) => 
      f.technicienId !== this.user.id
    );
  }

  deposerConge() {
    const demande = {
      ...this.conge,
      utilisateur: { id: this.user.id },
      manager: { id: 4 }
    };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur', error));
  }

  updateStatutConge(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges(), error => console.error('Erreur', error));
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showDetailModal = true;
  }

  fermerDetailFiche() {
    this.showDetailModal = false;
    this.selectedFiche = null;
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
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches d\'Intervention de mes Techniciens';
      case 'interventions': return 'Interventions';
      case 'planning': return 'Planning';
      case 'crm': return 'CRM';
      case 'stock': return 'Stock';
      case 'commandes': return 'Commandes Achat';
      case 'conges-tech': return 'Congés Techniciens à Valider';
      case 'mes-conges': return 'Mes Congés';
      case 'remonteesTerrain': return 'Remontées Terrain de mes Techniciens';
      default: return 'KIA Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}