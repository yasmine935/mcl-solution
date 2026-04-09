import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-aby',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-aby.html',
  styleUrl: './dashboard-aby.css'
})
export class DashboardAby implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }
  set currentPage(value: string) { this._currentPage = value; }

  // Données
  demandesMateriel: any[] = [];
  commandes: any[] = [];
  stocks: any[] = [];
  showFormCommande = false;
  showDetailDemande: any = null;

  nouvelleCommande = {
    reference: '', fournisseur: '', description: '',
    quantite: '', prixUnitaire: '', statut: 'En attente',
    dateCommande: '', dateLivraison: '', demandeId: null as any
  };

  statutsCommande = ['En attente', 'Commandé', 'En transit', 'Livré', 'Annulé'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadDemandesMateriel();
    this.loadCommandes();
    this.loadStocks();
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
      quantite: parseInt(this.nouvelleCommande.quantite) || 1,
      prixUnitaire: parseFloat(this.nouvelleCommande.prixUnitaire) || 0,
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
      'commandes': 'Commandes & Achats',
      'logistique': 'Logistique & Stock'
    };
    return map[this.currentPage] || 'Supply Chain';
  }

  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}