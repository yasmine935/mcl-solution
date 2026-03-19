import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-essan',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './dashboard-essan.html',
  styleUrl: './dashboard-essan.css'
})
export class DashboardEssan implements OnInit {
  user: any = {};
  currentPage = 'home';

  interventions: any[] = [];
  conges: any[] = [];
  employes: any[] = [];
  tickets: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadTickets();
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Problème système', statut: 'OUVERT', date: '2026-01-18' },
      { id: 2, titre: 'Maintenance', statut: 'EN_COURS', date: '2026-01-15' },
      { id: 3, titre: 'Migration', statut: 'EN_COURS', date: '2026-01-16' }
    ];
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Vue d\'Ensemble';
      case 'conges': return 'Congés (Lecture seule)';
      case 'employes': return 'Employés';
      case 'tickets': return 'Tickets (Lecture seule)';
      default: return 'Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}