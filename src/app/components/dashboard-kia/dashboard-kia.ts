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
  selector: 'app-dashboard-kia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule
  ],
  templateUrl: './dashboard-kia.html',
  styleUrl: './dashboard-kia.css'
})
export class DashboardKia implements OnInit {
  user: any = {};
  currentPage = 'home';
  showCongeForm = false;

  interventions: any[] = [];
  conges: any[] = [];
  tousLesConges: any[] = [];
  planning: any[] = [];

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadConges();
    this.loadTousLesConges();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data);
  }

  loadTousLesConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => {
        this.tousLesConges = data.filter((c: any) => 
          c.utilisateur?.role === 'TECHNICIEN'
        );
      });
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
      });
  }

  updateStatut(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadTousLesConges());
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'interventions': return 'Gestion des Interventions';
      case 'mes-conges': return 'Mes Congés';
      case 'conges-tech': return 'Congés des Techniciens';
      case 'planning': return 'Planning';
      case 'crm': return 'CRM';
      case 'stock': return 'Stock';
      case 'commandes': return 'Commandes Achat';
      default: return 'Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}