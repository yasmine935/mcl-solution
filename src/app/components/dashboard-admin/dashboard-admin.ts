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
import { Employes } from '../employes/employes';
import { Taches } from '../taches/taches';
import { Documents } from '../documents/documents';
import { FichesCompletees } from '../fiches-completees/fiches-completees';
import { Factures } from '../factures/factures';
import { Semenier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';
import { Voitures } from '../voitures/voitures';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';


@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager,Employes ,Taches, Documents, FichesCompletees, Factures, Semenier, Planning , TicketingComponent , Voitures, RemonteesTerrainComponent, ApprovisionnementComponent
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdmin implements OnInit {
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

  showCreateFiche = false;
  showDetailFicheModal = false;
  showReclamationDetailModal = false;

  fiches: any[] = [];
  fichesFiltrees: any[] = [];
  ficheCompletees: any[] = [];
  conges: any[] = [];
  employes: any[] = [];
  reclamations: any[] = [];
  documents: any[] = [];
  tickets: any[] = [];
  factures: any[] = [];
  utilisateurs: any[] = [];

  selectedFiche: any = null;
  selectedReclamation: any = null;
  techniciensDisponibles: any[] = [];

  nouveauFiche = {
    numero: '',
    client: '',
    description: '',
    date: '',
    technicienId: null,
    technicienNom: ''
  };
voitures: any[] = [];
showFormVoiture = false;
nouvelleVoiture = {
  immatriculation: '', marque: '', modele: '',
  annee: '', kilometrage: '', statut: 'Disponible',
  conducteur: '', prochainControle: ''
};
statutsVoiture = ['Disponible', 'En service', 'En maintenance', 'Hors service'];
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }
minutesSecurite: any[] = [];

loadMinutesSecurite() {
  this.http.get<any[]>('http://localhost:8080/api/minutes-securite').subscribe({
    next: (data) => this.minutesSecurite = data,
    error: () => this.minutesSecurite = []
  });
}

marquerMinuteLue(id: number) {
  this.http.put(`http://localhost:8080/api/minutes-securite/${id}/lu`, {}).subscribe({
    next: () => {
      const m = this.minutesSecurite.find(x => x.id === id);
      if (m) m.statut = 'LU';
    }
  });
}

get minutesAlertes(): number {
  return this.minutesSecurite.filter(m => m.statut === 'ALERTE').length;
}

get minutesOk(): number {
  return this.minutesSecurite.filter(m => m.statut !== 'ALERTE').length;
}
  loadData() {
  this.loadFiches();
  this.loadConges();
  this.loadEmployes();
  this.loadReclamations();
  this.loadDocuments();
  this.loadTickets();
  this.loadFactures();
  this.loadVoitures();
  this.loadMinutesSecurite();
  this.loadResetRequests();
}

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    const toutesLesFiches = stored ? JSON.parse(stored) : [];
    
    this.fichesFiltrees = toutesLesFiches.filter((f: any) => f.statut === 'EN_COURS');
    this.ficheCompletees = toutesLesFiches.filter((f: any) => f.statut === 'COMPLETEE');
    this.fiches = toutesLesFiches;
  }

  // ============================================================
// AJOUTER dans dashboard-admin.ts
// ============================================================

// 1. Dans les propriétés de la classe (après filtreConge):
filtreConge = 'TOUS';

// 2. Ajouter ces méthodes dans la classe :

getCongesEnAttente(): number {
  return this.conges.filter((c: any) => c.statut === 'EN_ATTENTE').length;
}

getCongesApprouves(): number {
  return this.conges.filter((c: any) => c.statut === 'APPROUVE').length;
}

getCongesRefuses(): number {
  return this.conges.filter((c: any) => c.statut === 'REFUSE').length;
}

getCongesFiltres(): any[] {
  if (this.filtreConge === 'TOUS') return this.conges;
  return this.conges.filter((c: any) => c.statut === this.filtreConge);
}

calculerJours(dateDebut: string, dateFin: string): string {
  if (!dateDebut || !dateFin || dateDebut === '-' || dateFin === '-') return '-';
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diff = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? `${diff}j` : '-';
}
  loadConges() {
    this.http.get<any[]>('http://localhost:8080/api/conges')
      .subscribe(data => {
        this.conges = data;
      }, error => {
        this.conges = [];
      });
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => {
        this.employes = data;
        this.utilisateurs = data;
        this.techniciensDisponibles = data.filter((e: any) => 
          e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP'
        );
      }, error => {
        this.employes = [];
        this.utilisateurs = [];
      });
  }

loadReclamations() {
  this.http.get<any[]>('http://localhost:8080/api/reclamations-sse')
    .subscribe({
      next: (data) => this.reclamations = data,
      error: () => {
        const stored = localStorage.getItem('reclamations');
        this.reclamations = stored ? JSON.parse(stored) : [];
      }
    });
}

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Politique d\'entreprise', date: '2025-12-01', type: 'PDF' },
      { id: 2, nom: 'Manuel d\'utilisation', date: '2025-11-15', type: 'PDF' },
      { id: 3, nom: 'Charte de sécurité', date: '2025-10-01', type: 'DOCX' },
      { id: 4, nom: 'Procédures RH', date: '2025-09-20', type: 'PDF' }
    ];
  }

  loadTickets() {
    this.tickets = [
      { id: 1, titre: 'Problème critique système', statut: 'OUVERT', priorite: 'HAUTE', date: '2026-01-18' },
      { id: 2, titre: 'Amélioration infrastructure', statut: 'EN_COURS', priorite: 'MOYENNE', date: '2026-01-15' },
      { id: 3, titre: 'Migration données', statut: 'EN_COURS', priorite: 'HAUTE', date: '2026-01-16' },
      { id: 4, titre: 'Maintenance serveurs', statut: 'PLANIFIE', priorite: 'MOYENNE', date: '2026-01-20' }
    ];
  }

  loadFactures() {
    this.factures = [
      { id: 1, numero: 'FAC-2026-001', client: 'Client A', montant: '5000€', date: '2026-01-15', statut: 'PAYEE' },
      { id: 2, numero: 'FAC-2026-002', client: 'Client B', montant: '3500€', date: '2026-01-12', statut: 'EN_ATTENTE' },
      { id: 3, numero: 'FAC-2026-003', client: 'Client C', montant: '7200€', date: '2026-01-10', statut: 'PAYEE' }
    ];
  }

  creerFiche() {
    if (!this.nouveauFiche.numero || !this.nouveauFiche.client || !this.nouveauFiche.technicienId) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const idIncrement = Math.max(...this.fiches.map(f => f.id || 0), 0) + 1;
    const nouvelleFiche = {
      id: idIncrement,
      ...this.nouveauFiche,
      statut: 'EN_COURS',
      dateCreation: new Date().toISOString()
    };

    this.fiches.push(nouvelleFiche);
    this.fichesFiltrees.push(nouvelleFiche);
    
    localStorage.setItem('interventions', JSON.stringify(this.fiches));
    
    this.showCreateFiche = false;
    this.nouveauFiche = { numero: '', client: '', description: '', date: '', technicienId: null, technicienNom: '' };
  }

  ouvrirDetailFiche(fiche: any) {
    this.selectedFiche = fiche;
    this.showDetailFicheModal = true;
  }

  fermerDetailFiche() {
    this.showDetailFicheModal = false;
    this.selectedFiche = null;
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
      case 'home': return 'Tableau de Bord Admin';
      case 'fiches': return 'Fiches d\'Intervention';
      case 'tousLesConges': return 'Tous les Congés';
      case 'employes': return 'Employés';
      case 'documents': return 'Documents';
      case 'reclamations': return 'Réclamations';
      case 'support': return 'Support';
      case 'factures': return 'Factures';
      case 'utilisateurs': return 'Utilisateurs';
      case 'tickets': return '🎫 Tickets Clients';
      default: return 'Dashboard Admin';
      case 'voitures': return '🚗 Parc Automobile';
    }
  }
loadVoitures() {
  const stored = localStorage.getItem('mcl_voitures');
  this.voitures = stored ? JSON.parse(stored) : [];
}

saveVoitures() { localStorage.setItem('mcl_voitures', JSON.stringify(this.voitures)); }

ajouterVoiture() {
  if (!this.nouvelleVoiture.immatriculation || !this.nouvelleVoiture.marque) {
    alert('Champs obligatoires manquants');
    return;
  }
  const id = Math.max(...this.voitures.map((v: any) => v.id || 0), 0) + 1;
  this.voitures.push({ id, ...this.nouvelleVoiture });
  this.saveVoitures();
  this.nouvelleVoiture = { immatriculation: '', marque: '', modele: '', annee: '', kilometrage: '', statut: 'Disponible', conducteur: '', prochainControle: '' };
  this.showFormVoiture = false;
}

supprimerVoiture(id: number) {
  if (confirm('Supprimer ?')) {
    this.voitures = this.voitures.filter((v: any) => v.id !== id);
    this.saveVoitures();
  }
}

getStatutVoitureColor(statut: string): string {
  const map: any = { 'Disponible': '#2e7d32', 'En service': '#1565c0', 'En maintenance': '#f57f17', 'Hors service': '#c62828' };
  return map[statut] || '#546e7a';
}
  // ===== RESET PASSWORD =====
  resetRequests: any[] = [];
  showResetModal = false;
  selectedReset: any = null;
  newPassword = '';
  resetSuccess = '';

  loadResetRequests() {
    this.http.get<any[]>('http://localhost:8080/api/auth/reset-requests').subscribe({
      next: (data) => this.resetRequests = data,
      error: () => this.resetRequests = []
    });
  }

  ouvrirReset(req: any) {
    this.selectedReset = req;
    this.newPassword = '';
    this.resetSuccess = '';
    this.showResetModal = true;
  }

  fermerReset() { this.showResetModal = false; this.selectedReset = null; }

  confirmerReset() {
    if (!this.newPassword.trim()) { alert('Entrez un nouveau mot de passe'); return; }
    this.http.put(`http://localhost:8080/api/auth/reset-requests/${this.selectedReset.id}/reset`,
      { newPassword: this.newPassword }, { responseType: 'text' }).subscribe({
      next: () => {
        this.resetSuccess = 'Mot de passe réinitialisé avec succès !';
        this.loadResetRequests();
        setTimeout(() => this.fermerReset(), 1500);
      },
      error: () => alert('Erreur lors de la réinitialisation')
    });
  }

  get countResetPending(): number { return this.resetRequests.length; }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}