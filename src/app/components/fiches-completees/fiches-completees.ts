import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-fiches-completees',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './fiches-completees.html',
  styleUrl: './fiches-completees.css'
})
export class FichesCompletees implements OnInit {
  fichesCompletees: any[] = [];
  selectedFiche: any = null;
  showDetailModal = false;
  filterStatut = 'PENDING'; // PENDING, VALIDEE

  constructor() {}

  ngOnInit() {
    this.loadFichesCompletees();
  }

  loadFichesCompletees() {
    const stored = localStorage.getItem('fiches_intervention');
    const toutes = stored ? JSON.parse(stored) : [];
    
    // Filtrer les fiches avec statut COMPLETEE (envoyées par le technicien)
    this.fichesCompletees = toutes.filter((f: any) => f.statut === 'COMPLETEE');
    
    console.log('📋 Fiches complétées trouvées:', this.fichesCompletees.length);
  }

  getFichesAffichees(): any[] {
    if (this.filterStatut === 'PENDING') {
      return this.fichesCompletees.filter((f: any) => !f.approuvePar);
    } else if (this.filterStatut === 'VALIDEE') {
      return this.fichesCompletees.filter((f: any) => f.approuvePar);
    }
    return this.fichesCompletees;
  }

  ouvrirDetail(fiche: any) {
    this.selectedFiche = JSON.parse(JSON.stringify(fiche));
    this.showDetailModal = true;
  }

  fermerDetail() {
    this.showDetailModal = false;
    this.selectedFiche = null;
  }

  // ✅ VALIDER ET CRÉER FACTURE
  validerFiche(fiche: any) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nomManager = `${user.prenom} ${user.nom}`;

    if (confirm(`Valider le travail du technicien (${fiche.technicienAssigne}) ?`)) {
      const stored = localStorage.getItem('fiches_intervention');
      const toutes = stored ? JSON.parse(stored) : [];
      
      const index = toutes.findIndex((f: any) => f.id === fiche.id);
      if (index !== -1) {
        toutes[index].approuvePar = nomManager;
        toutes[index].dateApprobation = new Date().toISOString();
        toutes[index].statut = 'VALIDEE';
        
        localStorage.setItem('fiches_intervention', JSON.stringify(toutes));

        // ✅ CRÉER LA FACTURE AUTOMATIQUEMENT
        const factures = this.loadFactures();
        const numFacture = `FAC-${new Date().getFullYear()}-${String(factures.length + 1).padStart(3, '0')}`;
        
        const nouvelleFacture = {
          id: Math.max(...factures.map((f: any) => f.id || 0), 0) + 1,
          numero: numFacture,
          client: fiche.client,
          montant: fiche.chiffreAffaire || 0,
          date: new Date().toLocaleDateString('fr-FR'),
          statut: 'EN_ATTENTE',
          ficheSouvenanceId: fiche.id
        };

        factures.push(nouvelleFacture);
        localStorage.setItem('factures', JSON.stringify(factures));
        
        alert(`✅ Fiche validée par ${nomManager}\n💰 Facture créée: ${numFacture}`);
        this.loadFichesCompletees();
        this.fermerDetail();
      }
    }
  }

  getCountPending(): number {
    return this.fichesCompletees.filter((f: any) => !f.approuvePar).length;
  }

  getCountValidees(): number {
    return this.fichesCompletees.filter((f: any) => f.approuvePar).length;
  }

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
    if (!this.selectedFiche || !this.selectedFiche.photos) {
      return '';
    }
    return this.selectedFiche.photos.map((p: any) => p.nom).join(', ');
  }

  loadFactures(): any[] {
    const stored = localStorage.getItem('factures');
    return stored ? JSON.parse(stored) : [];
  }
}