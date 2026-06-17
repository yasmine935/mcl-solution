import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApprovisionnementComponent } from '../approvisionnement/approvisionnement';
import { Planning } from '../planning/planning';
import { Taches } from '../taches/taches';

@Component({
  selector: 'app-dashboard-aby',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, ApprovisionnementComponent, Planning, Taches],
  templateUrl: './dashboard-aby.html',
  styleUrl: './dashboard-aby.css'
})
export class DashboardAby implements OnInit {
  user: any = {};
  sidebarOpen = false;

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

  // Données
  demandesMateriel: any[] = [];
  commandes: any[] = [];
  stocks: any[] = [];
  showFormCommande = false;
  showDetailDemande: any = null;

  // Projets (lecture seule)
  projets: any[] = [];
  projetSelectionne: any = null;

  // Messagerie ABY ↔ MCL
  messages: any[] = [];
  showComposeForm = false;
  nouveauMessage = { sujet: '', contenu: '' };
  messageSelectionne: any = null;
  envoiEnCours = false;
  repliesCourantes: any[] = [];
  nouvelleReponse = '';
  envoiReponseEnCours = false;

  nouvelleCommande = {
    reference: '', fournisseur: '', description: '',
    quantite: '', prixUnitaire: '', statut: 'En attente',
    dateCommande: '', dateLivraison: '', demandeId: null as any
  };

  statutsCommande = ['En attente', 'Commandé', 'En transit', 'Livré', 'Annulé'];

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadDemandesMateriel();
    this.loadCommandes();
    this.loadStocks();
    this.loadProjets();
    this.loadMessages();
  }

  loadProjets() {
    this.http.get<any[]>('http://localhost:8080/api/taches').subscribe({
      next: (data) => this.projets = data,
      error: () => this.projets = []
    });
  }

  loadMessages() {
    const expediteur = this.user.username || this.user.prenom || 'ABY';
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

  envoyerReponseAby() {
    if (!this.nouvelleReponse.trim() || !this.messageSelectionne) return;
    this.envoiReponseEnCours = true;
    const auteur = this.user.username || this.user.prenom || 'ABY';
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

  envoyerMessage() {
    if (!this.nouveauMessage.sujet.trim() || !this.nouveauMessage.contenu.trim()) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }
    this.envoiEnCours = true;
    const expediteur = this.user.username || this.user.prenom || 'ABY';
    const body = {
      expediteur,
      destinataire: 'MCL Solutions',
      sujet: this.nouveauMessage.sujet,
      contenu: this.nouveauMessage.contenu
    };
    this.http.post<any>('http://localhost:8080/api/messages-aby', body).subscribe({
      next: (msg) => {
        this.messages.unshift(msg);
        this.nouveauMessage = { sujet: '', contenu: '' };
        this.showComposeForm = false;
        this.envoiEnCours = false;
      },
      error: () => {
        alert('Erreur lors de l\'envoi. Réessayez.');
        this.envoiEnCours = false;
      }
    });
  }

  // ✅ Demandes de matériel envoyées par Ferid/Aurélien
  loadDemandesMateriel() {
    const stored = localStorage.getItem('demandes_materiel');
    this.demandesMateriel = stored ? JSON.parse(stored) : [];
  }

  // ✅ Commandes depuis le backend
  loadCommandes() {
    this.http.get<any[]>('http://localhost:8080/api/commandes').subscribe({
      next: (data) => this.commandes = data,
      error: () => {
        const stored = localStorage.getItem('commandes_aby');
        this.commandes = stored ? JSON.parse(stored) : [];
      }
    });
  }

  loadStocks() {
    this.http.get<any[]>('http://localhost:8080/api/stock').subscribe({
      next: (data) => this.stocks = data,
      error: () => this.stocks = []
    });
  }

  // ✅ Traiter une demande → créer une commande
  traiterDemande(demande: any) {
    this.nouvelleCommande = {
      reference: `CMD-${Date.now()}`,
      fournisseur: '',
      description: demande.materiel,
      quantite: demande.quantite || '1',
      prixUnitaire: '',
      statut: 'En attente',
      dateCommande: new Date().toISOString().split('T')[0],
      dateLivraison: '',
      demandeId: demande.id
    };
    this.showFormCommande = true;
    this.currentPage = 'commandes';
  }

  ajouterCommande() {
    if (!this.nouvelleCommande.reference || !this.nouvelleCommande.description) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    const body = {
      numeroCommande: this.nouvelleCommande.reference,
      fournisseur: this.nouvelleCommande.fournisseur,
      description: this.nouvelleCommande.description,
      quantite: Number.parseInt(this.nouvelleCommande.quantite) || 1,
      prixUnitaire: Number.parseFloat(this.nouvelleCommande.prixUnitaire) || 0,
      statut: 'EN_ATTENTE',
      dateCommande: this.nouvelleCommande.dateCommande || null,
      dateLivraisonPrevue: this.nouvelleCommande.dateLivraison || null
    };

    this.http.post<any>('http://localhost:8080/api/commandes', body).subscribe({
      next: (cmd) => {
        this.commandes.push(cmd);
        // Marquer la demande comme traitée
        if (this.nouvelleCommande.demandeId) {
          this.marquerDemandeTraitee(this.nouvelleCommande.demandeId);
        }
        this.resetFormCommande();
        this.showFormCommande = false;
        alert('✅ Commande créée !');
      },
      error: () => {
        // Fallback localStorage
        const cmd = { id: Date.now(), ...this.nouvelleCommande };
        this.commandes.push(cmd);
        localStorage.setItem('commandes_aby', JSON.stringify(this.commandes));
        this.resetFormCommande();
        this.showFormCommande = false;
      }
    });
  }

  marquerDemandeTraitee(demandeId: any) {
    const idx = this.demandesMateriel.findIndex(d => d.id === demandeId);
    if (idx !== -1) {
      this.demandesMateriel[idx].statut = 'Traité';
      localStorage.setItem('demandes_materiel', JSON.stringify(this.demandesMateriel));
    }
  }

  updateStatutCommande(id: any, statut: string) {
    this.http.put(`http://localhost:8080/api/commandes/${id}/statut?statut=${statut}`, {}).subscribe({
      next: () => {
        const cmd = this.commandes.find(c => c.id === id);
        if (cmd) cmd.statut = statut;
      },
      error: () => {
        const cmd = this.commandes.find(c => c.id === id);
        if (cmd) cmd.statut = statut;
        localStorage.setItem('commandes_aby', JSON.stringify(this.commandes));
      }
    });
  }

  resetFormCommande() {
    this.nouvelleCommande = {
      reference: '', fournisseur: '', description: '',
      quantite: '', prixUnitaire: '', statut: 'En attente',
      dateCommande: '', dateLivraison: '', demandeId: null
    };
  }

  getStatutColor(statut: string): string {
    const map: any = {
      'En attente': '#f57f17', 'EN_ATTENTE': '#f57f17',
      'Commandé': '#1565c0', 'EN_COURS': '#1565c0',
      'En transit': '#6a1b9a',
      'Livré': '#2e7d32', 'LIVRE': '#2e7d32',
      'Annulé': '#c62828', 'ANNULE': '#c62828'
    };
    return map[statut] || '#546e7a';
  }

  getStatutDemandeColor(statut: string): string {
    const map: any = {
      'En attente': '#f57f17', 'Traité': '#2e7d32', 'Urgent': '#c62828'
    };
    return map[statut] || '#546e7a';
  }

  get demandesEnAttente() { return this.demandesMateriel.filter(d => d.statut !== 'Traité'); }
  get commandesEnCours() { return this.commandes.filter(c => c.statut !== 'Livré' && c.statut !== 'LIVRE' && c.statut !== 'Annulé'); }

  getPageTitle(): string {
    const map: any = {
      'home': 'Tableau de Bord Supply Chain',
      'demandes': 'Demandes Matériel',
      'approvisionnement': 'Fiches Approvisionnement',
      'planning': 'Planning MCL Solutions',
      'projets': 'Suivi Projets',
      'messagerie': 'Messagerie — MCL Solutions',
      'commandes': 'Commandes & Achats',
      'logistique': 'Logistique & Stock'
    };
    return map[this.currentPage] || 'Supply Chain';
  }

  getPrioriteColor(priorite: string): string {
    const map: any = { 'Élevé': '#c62828', 'Moyenne': '#f57f17', 'Faible': '#2e7d32' };
    return map[priorite] || '#546e7a';
  }

  getProjetStatutColor(statut: string): string {
    const map: any = {
      'A_FAIRE': '#546e7a', 'EN_COURS': '#1565c0',
      'TERMINEE': '#2e7d32', 'Perdu': '#c62828', 'En Attente': '#f57f17'
    };
    return map[statut] || '#546e7a';
  }

  getProjetStatutLabel(statut: string): string {
    const map: any = {
      'A_FAIRE': 'À faire', 'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée', 'Perdu': 'Perdu', 'En Attente': 'En attente'
    };
    return map[statut] || statut;
  }

  get messagesAvecReponse() { return this.messages.filter(m => m.reponse); }
  get messagesEnAttente() { return this.messages.filter(m => !m.reponse); }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}