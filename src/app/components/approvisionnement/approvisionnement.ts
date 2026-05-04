import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:8080/api';

@Component({
  selector: 'app-approvisionnement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvisionnement.html',
  styleUrl: './approvisionnement.css'
})
export class ApprovisionnementComponent implements OnInit {
  @Input() modeaby = false;

  currentUser: any = {};
  view: 'liste' | 'nouveau' | 'detail' = 'liste';
  demandes: any[] = [];
  selectedDemande: any = null;
  form: any = {};
  lignes: any[] = [];

  departments = ['MCL Solutions', 'Technique', 'Commercial', 'RH', 'Finance', 'Direction'];
  oui_non = ['Oui', 'Non', 'En cours'];

  // ── LISTE D'ATTENTE ──
  listeAttente: any[] = [];
  showListeAttente = false;
  showAddAttenteForm = false;
  nouvelArticleAttente = { marque: '', designation: '', refFournisseur: '', nomFournisseur: '', refMCL: '', quantite: 1 };
  showImportPanel = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadDemandes();
    this.loadListeAttente();
  }

  // ══════════ DEMANDES — BACKEND ══════════

  loadDemandes() {
    const url = this.modeaby
      ? `${API}/demandes-appro`
      : `${API}/demandes-appro/demandeur/${this.currentUser.id}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => this.demandes = data,
      error: () => this.demandes = []
    });
  }

  genererNumero(): string {
    const year = new Date().getFullYear();
    const next = String(this.demandes.length + 1).padStart(4, '0');
    return `PR-${year}${next}`;
  }

  nouvelleLigne(): any {
    return { marque: '', designation: '', refFournisseur: '', nomFournisseur: '', refMCL: '', quantite: 1 };
  }

  ouvrirNouveau() {
    this.form = {
      numero: this.genererNumero(),
      dateCreation: new Date().toLocaleDateString('fr-FR'),
      demandeur: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      demandeurId: this.currentUser.id,
      dateAttendue: '',
      department: 'MCL Solutions',
      nomProjet: '',
      codeAffaire: '',
      responsableProjet: '',
      commandeClientRecue: '',
      montantTotal: '',
      quotationsObtenues: '',
      devisFile: null,
      commentaires: '',
      statut: 'En attente'
    };
    this.lignes = [this.nouvelleLigne()];
    this.view = 'nouveau';
  }

  ajouterLigne() { this.lignes.push(this.nouvelleLigne()); }

  supprimerLigne(i: number) {
    if (this.lignes.length > 1) this.lignes.splice(i, 1);
  }

  onDevisSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.form.devisFile = {
      nom: file.name,
      taille: (file.size / 1024).toFixed(1) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
    };
  }

  soumettre() {
    if (!this.form.dateAttendue || !this.form.department || !this.form.nomProjet || !this.form.codeAffaire) {
      alert('Veuillez remplir les champs obligatoires (*)');
      return;
    }
    const lignesValides = this.lignes.filter(l => l.designation.trim());
    if (lignesValides.length === 0) {
      alert('Ajoutez au moins un produit à approvisionner');
      return;
    }
    const body = { ...this.form, lignes: lignesValides };
    this.http.post<any>(`${API}/demandes-appro`, body).subscribe({
      next: (created) => {
        this.demandes.unshift(created);
        this.view = 'liste';
        alert(`✅ Demande ${created.numero} envoyée à Aby !`);
      },
      error: () => alert('❌ Erreur envoi demande')
    });
  }

  voirDetail(d: any) {
    this.selectedDemande = { ...d };
    this.view = 'detail';
  }

  retour() { this.view = 'liste'; this.selectedDemande = null; }

  changerStatut(statut: string) {
    if (!this.selectedDemande) return;
    const traitePar = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    this.http.put<any>(
      `${API}/demandes-appro/${this.selectedDemande.id}/statut?statut=${statut}&traitePar=${encodeURIComponent(traitePar)}`,
      {}
    ).subscribe({
      next: (updated) => {
        this.selectedDemande = { ...updated };
        this.loadDemandes();
      },
      error: () => alert('❌ Erreur changement statut')
    });
  }

  // ══════════ LISTE D'ATTENTE — BACKEND ══════════

  loadListeAttente() {
    if (!this.currentUser.id || this.modeaby) return;
    this.http.get<any[]>(`${API}/articles-attente/utilisateur/${this.currentUser.id}`).subscribe({
      next: (data) => this.listeAttente = data,
      error: () => this.listeAttente = []
    });
  }

  ajouterAListe() {
    if (!this.nouvelArticleAttente.designation.trim()) {
      alert('La désignation est obligatoire');
      return;
    }
    const body = {
      ...this.nouvelArticleAttente,
      utilisateurId: this.currentUser.id,
      dateAjout: new Date().toLocaleDateString('fr-FR')
    };
    this.http.post<any>(`${API}/articles-attente`, body).subscribe({
      next: (created) => {
        this.listeAttente.push(created);
        this.nouvelArticleAttente = { marque: '', designation: '', refFournisseur: '', nomFournisseur: '', refMCL: '', quantite: 1 };
        this.showAddAttenteForm = false;
      },
      error: () => alert('❌ Erreur ajout article')
    });
  }

  supprimerDeListe(id: number) {
    this.http.delete(`${API}/articles-attente/${id}`).subscribe({
      next: () => this.listeAttente = this.listeAttente.filter(a => a.id !== id),
      error: () => alert('❌ Erreur suppression')
    });
  }

  importerDansFormulaire(article: any) {
    this.lignes.push({
      marque: article.marque,
      designation: article.designation,
      refFournisseur: article.refFournisseur,
      nomFournisseur: article.nomFournisseur,
      refMCL: article.refMCL,
      quantite: article.quantite
    });
    this.supprimerDeListe(article.id);
  }

  importerTout() {
    this.listeAttente.forEach(a => {
      this.lignes.push({
        marque: a.marque,
        designation: a.designation,
        refFournisseur: a.refFournisseur,
        nomFournisseur: a.nomFournisseur,
        refMCL: a.refMCL,
        quantite: a.quantite
      });
      this.http.delete(`${API}/articles-attente/${a.id}`).subscribe();
    });
    this.listeAttente = [];
    this.showImportPanel = false;
  }

  // ══════════ HELPERS ══════════

  getStatutClass(statut: string): string {
    const map: any = {
      'En attente': 'statut-attente',
      'En cours': 'statut-cours',
      'Traité': 'statut-traite',
      'Refusé': 'statut-refuse'
    };
    return map[statut] || '';
  }

  get demandesEnAttente() { return this.demandes.filter(d => d.statut === 'En attente'); }
  get demandesEnCours() { return this.demandes.filter(d => d.statut === 'En cours'); }
  get demandesTraitees() { return this.demandes.filter(d => d.statut === 'Traité'); }
}
