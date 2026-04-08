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
import { Semenier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain'; // ✅ NOUVEAU

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    Semenier, Planning,
    RemonteesTerrainComponent // ✅ NOUVEAU
  ],
  templateUrl: './dashboard-technicien.html',
  styleUrl: './dashboard-technicien.css'
})
export class DashboardTechnicien implements OnInit {
  user: any = {};
  
  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) {
    this._currentPage = value;
  }

  showCongeForm = false;
  interventions: any[] = [];
  interventionsCompletees: any[] = [];
  conges: any[] = [];

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadInterventions();
    this.loadConges();
  }

  loadInterventions() {
  this.http.get<any[]>('http://localhost:8080/api/fiches-intervention').subscribe({
    next: (data) => {
      const userFullName = `${this.user.prenom} ${this.user.nom}`;
      const mesFiches = data.filter((f: any) =>
        f.technicien &&
        `${f.technicien.prenom} ${f.technicien.nom}` === userFullName
      );
      this.interventions = mesFiches.filter((f: any) => f.statut !== 'COMPLETEE' && f.statut !== 'VALIDEE');
      this.interventionsCompletees = mesFiches.filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE');
      localStorage.setItem('fiches_intervention', JSON.stringify(data));
    },
    error: () => console.error('Erreur chargement interventions')
  });
}

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  getCountInterventionsEnCours(): number { return this.interventions.length; }
  getCountInterventionsCompletees(): number { return this.interventionsCompletees.length; }

  // ✅ Compte les fiches SSE du technicien
  getCountReclamations(): number {
    const stored = localStorage.getItem('ficheSSETerrain');
    const all = stored ? JSON.parse(stored) : [];
    return all.filter((f: any) => f.technicienId === String(this.user.id)).length;
  }

  deposerConge() {
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 3 } };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur envoi conge', error));
  }

  ouvrirFiche(fichId: number) {
    this.router.navigate(['/fiche-intervention-tech', fichId]);
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home':          return 'Mon Dashboard';
      case 'interventions': return 'Mes Interventions';
      case 'completees':    return 'Interventions Completees';
      case 'conges':        return 'Mes Conges';
      case 'reclamations':  return 'Remontees SSE Terrain'; // ✅ NOUVEAU NOM
      case 'semenier':      return 'Semenier';
      case 'planning':      return 'Planning';
      default: return 'Dashboard Technicien';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}