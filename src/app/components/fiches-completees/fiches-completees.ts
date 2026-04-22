import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const API_FICHES = 'http://localhost:8080/api/fiches-intervention';
const API_FACTURES = 'http://localhost:8080/api/factures';

@Component({
  selector: 'app-fiches-completees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './fiches-completees.html',
  styleUrl: './fiches-completees.css'
})
export class FichesCompletees implements OnInit {
  fichesCompletees: any[] = [];
  selectedFiche: any = null;
  showDetailModal = false;
  filterStatut = 'PENDING';
  currentUser: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadFichesCompletees();
  }

  loadFichesCompletees() {
    this.http.get<any[]>(API_FICHES).subscribe({
      next: (data) => {
        this.fichesCompletees = data
          .filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE')
          .map((f: any) => ({
            ...f,
            date: f.dateIntervention,
            technicienAssigne: f.technicien ? `${f.technicien.prenom} ${f.technicien.nom}` : '',
            approuvePar: f.approuvePar || (f.statut === 'VALIDEE' ? 'Manager' : null),
            signatureTechnicien: f.signatureTechnicien || '',
            signatureClient: f.signatureClient || '',
            nomClientSigne: f.nomClientSigne || '',
            heureDebut: f.heureDebut || '',
            heureFin: f.heureFin || '',
            intervenants: f.intervenants || '',
            taches: f.taches || [],
            photos: f.photos || [],
            documentsImportes: f.documentsImportes || []
          }));
      },
      error: () => this.fichesCompletees = []
    });
  }

  getFichesAffichees(): any[] {
    if (this.filterStatut === 'PENDING') return this.fichesCompletees.filter((f: any) => f.statut === 'COMPLETEE');
    if (this.filterStatut === 'VALIDEE') return this.fichesCompletees.filter((f: any) => f.statut === 'VALIDEE');
    return this.fichesCompletees;
  }

  ouvrirDetail(fiche: any) { this.selectedFiche = JSON.parse(JSON.stringify(fiche)); this.showDetailModal = true; }
  fermerDetail() { this.showDetailModal = false; this.selectedFiche = null; }

  validerFiche(fiche: any) {
    const nomManager = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    if (confirm('Valider le travail du technicien ?')) {
      // 1. Mettre à jour le statut + approuvePar dans le backend
      const body = {
        approuvePar: nomManager,
        dateApprobation: new Date().toISOString()
      };
      this.http.put<any>(`${API_FICHES}/${fiche.id}/valider`, body).subscribe({
        next: () => {
          fiche.statut = 'VALIDEE';
          fiche.approuvePar = nomManager;
          // 2. Créer la facture
          const facture = {
            client: fiche.client, montantHT: fiche.chiffreAffaire || 0, tva: 20,
            statut: 'EN_ATTENTE', dateFacture: new Date().toISOString().split('T')[0],
            utilisateur: { id: this.currentUser.id }
          };
          this.http.post<any>(API_FACTURES, facture).subscribe({
            next: (f) => { alert(`Fiche validee !\nFacture creee: ${f.numero}`); this.loadFichesCompletees(); this.fermerDetail(); },
            error: () => { alert('Fiche validee ! (Erreur creation facture)'); this.loadFichesCompletees(); this.fermerDetail(); }
          });
        },
        error: () => alert('Erreur validation')
      });
    }
  }

  getCountPending(): number { return this.fichesCompletees.filter((f: any) => f.statut === 'COMPLETEE').length; }
  getCountValidees(): number { return this.fichesCompletees.filter((f: any) => f.statut === 'VALIDEE').length; }

  getStatutBadgeClass(statut: string): string {
    switch(statut) {
      case 'VALIDEE': return 'badge-validee';
      case 'EN_COURS': return 'badge-en-cours';
      default: return 'badge-pending';
    }
  }

  afficherSignature(signature: string): boolean {
    return !!(signature && typeof signature === 'string' && signature.startsWith('data:image'));
  }

  getPhotosNames(): string {
    if (!this.selectedFiche?.photos) return '';
    return this.selectedFiche.photos.map((p: any) => p.nom).join(', ');
  }
}