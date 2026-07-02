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
import { Semainier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { TicketingComponent } from '../ticketing/ticketing';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { GestionClients } from '../clients/clients';

@Component({
  selector: 'app-dashboard-aurelien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    FicheInterventionManager, Taches, FichesCompletees,
    Factures, Documents, Semainier, Planning, TicketingComponent,
    ApprovisionnementComponent, GestionClients
  ],
  templateUrl: './dashboard-aurelien.html',
  styleUrl: './dashboard-aurelien.css'
})
export class DashboardAurelien implements OnInit {
  user: any = {};
  sidebarOpen = false;

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) {
    this.fermerDetailFiche();
    this._currentPage = value;
  }

  showCongeForm = false;
  showDetailModal = false;

  interventions: any[] = [];
  conges: any[] = [];
  documents: any[] = [];
  employes: any[] = [];
  fiches: any[] = [];
  selectedFiche: any = null;

  // Messagerie ↔ MCL
  messages: any[] = [];
  showComposeForm = false;
  nouveauMessage = { sujet: '', contenu: '' };
  messageSelectionne: any = null;
  envoiEnCours = false;
  repliesCourantes: any[] = [];
  nouvelleReponse = '';
  envoiReponseEnCours = false;

  conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
  nombreJours = 0;
  congeEnEditionId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadConges();
    this.loadEmployes();
    this.loadDocuments();
    this.loadFiches();
    this.loadSoldeConges();
    this.loadMessages();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadDocuments() {
    this.documents = [
      { id: 1, nom: 'Rapport Intervention Jan 2026', date: '2026-01-15', type: 'PDF' },
      { id: 2, nom: 'Devis Client MCL', date: '2026-01-10', type: 'DOCX' },
      { id: 3, nom: 'Manuel Technique Cameras', date: '2025-12-20', type: 'PDF' },
      { id: 4, nom: 'Contrats Clients', date: '2025-12-15', type: 'PDF' },
      { id: 5, nom: 'PV de Reunion', date: '2026-01-08', type: 'DOCX' }
    ];
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs')
      .subscribe(data => this.employes = data, error => this.employes = []);
  }

  loadFiches() {
    const stored = localStorage.getItem('interventions');
    this.fiches = stored ? JSON.parse(stored) : [];
  }

  showSoldeEpuiseWarning = false;
  joursEnTropSolde = 0;

  deposerConge() {
    if (this.conge.dateDebut && this.conge.dateFin && this.conge.dateFin < this.conge.dateDebut) {
      alert('La date de fin ne peut pas être avant la date de début.');
      return;
    }
    if (this.conge.type === 'ANNUEL' && this.soldeConges) {
      const restant = this.soldeConges.soldeAnnuelRestant || 0;
      if (this.nombreJours > restant) {
        this.joursEnTropSolde = this.nombreJours - Math.max(0, restant);
        this.showSoldeEpuiseWarning = true;
        return;
      }
    }
    this.envoyerConge();
  }

  confirmerEnvoiMalgreSolde() {
    this.showSoldeEpuiseWarning = false;
    this.envoyerConge();
  }

  private envoyerConge() {
    const joursDepassement = this.joursEnTropSolde > 0 ? this.joursEnTropSolde : null;
    if (this.congeEnEditionId) {
      this.http.put(`http://localhost:8080/api/conges/${this.congeEnEditionId}`, { ...this.conge, joursDepassement }).subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.resetCongeForm();
        this.loadSoldeConges();
      }, error => console.error('Erreur modification conge', error));
      return;
    }
    const demande = { ...this.conge, joursDepassement, utilisateur: { id: this.user.id }, manager: { id: 4 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
      this.loadConges();
      this.showCongeForm = false;
      this.resetCongeForm();
      this.loadSoldeConges();
    }, error => console.error('Erreur envoi conge', error));
  }

  modifierMonConge(c: any) {
    this.congeEnEditionId = c.id;
    this.conge = { dateDebut: c.dateDebut, dateFin: c.dateFin, type: c.type, motif: c.motif || '', description: c.description || '', periode: c.periode || '' };
    this.calculerNombreJours();
    this.showCongeForm = true;
    this.showCongeDetail = false;
  }

  supprimerMonConge(id: number) {
    if (!confirm('Supprimer cette demande de congé ?')) return;
    this.http.delete(`http://localhost:8080/api/conges/${id}`).subscribe({
      next: () => {
        this.loadConges();
        this.loadSoldeConges();
        this.showCongeDetail = false;
        this.selectedConge = null;
      },
      error: () => alert('Erreur lors de la suppression')
    });
  }

  calculerNombreJours() {
    if (this.conge.dateDebut !== this.conge.dateFin) this.conge.periode = '';
    if (this.conge.dateDebut && this.conge.dateFin) {
      this.nombreJours = this.calculerJours(this.conge.dateDebut, this.conge.dateFin, this.conge.periode);
    } else {
      this.nombreJours = 0;
    }
  }

  onToggleDemiJournee(checked: boolean) {
    this.conge.periode = checked ? 'MATIN' : '';
    this.calculerNombreJours();
  }

  calculerJours(dateDebut: string, dateFin: string, periode?: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return 0;
    if (dateDebut === dateFin && (periode === 'MATIN' || periode === 'APRES_MIDI')) return 0.5;
    let jours = 0;
    const courant = new Date(debut);
    while (courant <= fin) {
      const jourSemaine = courant.getDay();
      if (jourSemaine !== 0 && jourSemaine !== 6) jours++;
      courant.setDate(courant.getDate() + 1);
    }
    return jours;
  }

  resetCongeForm() {
    this.conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
    this.nombreJours = 0;
    this.congeEnEditionId = null;
    this.joursEnTropSolde = 0;
  }
soldeConges: any = null;
selectedConge: any = null;
showCongeDetail = false;

pourcentageSoldeRestant(restant: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (restant / total) * 100));
}

ouvrirDetailConge(c: any) { this.selectedConge = c; this.showCongeDetail = true; }
fermerDetailConge() { this.showCongeDetail = false; this.selectedConge = null; }

loadSoldeConges() {
  if (!this.user.id) return;
  this.http.get<any>(`http://localhost:8080/api/conges/solde/${this.user.id}`).subscribe({
    next: (data) => this.soldeConges = data,
    error: () => this.soldeConges = null ,
    
  });
}
  ouvrirDetailFiche(fiche: any) { this.selectedFiche = fiche; this.showDetailModal = true; }
  fermerDetailFiche() { this.showDetailModal = false; this.selectedFiche = null; }

  loadMessages() {
    const expediteur = this.user.username || this.user.prenom || 'AURELIEN';
    this.http.get<any[]>(`http://localhost:8080/api/messages-aby/expediteur/${expediteur}`).subscribe({
      next: (data) => this.messages = data,
      error: () => this.messages = []
    });
  }

  ouvrirMessage(m: any) {
    this.messageSelectionne = m;
    this.repliesCourantes = [];
    this.nouvelleReponse = '';
    this.http.get<any[]>(`http://localhost:8080/api/messages-aby/${m.id}/replies`).subscribe({
      next: (data) => this.repliesCourantes = data,
      error: () => this.repliesCourantes = []
    });
  }

  envoyerMessage() {
    if (!this.nouveauMessage.sujet.trim() || !this.nouveauMessage.contenu.trim()) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }
    this.envoiEnCours = true;
    const expediteur = this.user.username || this.user.prenom || 'AURELIEN';
    const body = { expediteur, destinataire: 'MCL Solutions', sujet: this.nouveauMessage.sujet, contenu: this.nouveauMessage.contenu };
    this.http.post<any>('http://localhost:8080/api/messages-aby', body).subscribe({
      next: (msg) => {
        this.messages.unshift(msg);
        this.nouveauMessage = { sujet: '', contenu: '' };
        this.showComposeForm = false;
        this.envoiEnCours = false;
      },
      error: () => { alert('Erreur lors de l\'envoi. Réessayez.'); this.envoiEnCours = false; }
    });
  }

  envoyerReponseAurelien() {
    if (!this.nouvelleReponse.trim() || !this.messageSelectionne) return;
    this.envoiReponseEnCours = true;
    const auteur = this.user.username || this.user.prenom || 'AURELIEN';
    const body = { auteur, auteurRole: 'ABY', contenu: this.nouvelleReponse };
    this.http.post<any>(`http://localhost:8080/api/messages-aby/${this.messageSelectionne.id}/replies`, body).subscribe({
      next: (reply) => {
        this.repliesCourantes.push(reply);
        this.nouvelleReponse = '';
        this.envoiReponseEnCours = false;
      },
      error: () => { alert('Erreur lors de l\'envoi'); this.envoiReponseEnCours = false; }
    });
  }

  get messagesEnAttente() { return this.messages.filter(m => !m.reponse); }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'fiches': return 'Fiches Intervention';
      case 'fiches-completees': return 'Fiches Completees';
      case 'taches': return 'Taches';
      case 'planning': return 'Planning';
      case 'ged': return 'Documents';
      case 'Semainier': return 'Semainier';
      case 'tickets': return 'Tickets Clients';
      case 'factures': return 'Factures';
      case 'mes-conges': return 'Mes Conges';
      case 'approvisionnement': return 'Demandes d\'Approvisionnement';
      case 'messagerie': return 'Messagerie MCL Solutions';
      default: return 'Dashboard';
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login'], { replaceUrl: true }); }
}


