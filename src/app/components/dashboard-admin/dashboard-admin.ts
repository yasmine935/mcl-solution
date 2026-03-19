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
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdmin implements OnInit {
  user: any = {};
  currentPage = 'home';

  conges: any[] = [];
  employes: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  factures: any[] = [];
  utilisateurs: any[] = [];

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
    this.loadUtilisateurs();
  }

  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadUtilisateurs() {
    this.utilisateurs = this.employes;
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Archive 2025', date: '2025-12-31', type: 'PDF', taille: '2.5 GB' },
      { id: 2, nom: 'Rapport Annuel 2025', date: '2025-12-20', type: 'PDF', taille: '5 MB' },
      { id: 3, nom: 'Directives Entreprise', date: '2025-12-01', type: 'DOCX', taille: '1.2 MB' },
      { id: 4, nom: 'Contrats Clients', date: '2025-11-15', type: 'PDF', taille: '3.8 MB' },
      { id: 5, nom: 'Politique RH', date: '2025-10-01', type: 'DOCX', taille: '800 KB' }
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

  updateStatut(id: number, statut: string) {
    this.http.put(`http://localhost:8080/api/conges/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges(), error => console.error('Erreur', error));
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Tableau de Bord Admin';
      case 'interventions': return 'Fiches d\'Intervention';
      case 'conges': return 'Tous les Congés';
      case 'employes': return 'Gestion Employés';
      case 'documents': return 'Gestion Documentaire';
      case 'tickets': return 'Support Technique';
      case 'factures': return 'Factures & Comptabilité';
      case 'utilisateurs': return 'Utilisateurs & Permissions';
      default: return 'Admin Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}