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
  filterStatut = 'PENDING'; // PENDING, VALIDEE, REJETEE

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
        
        alert(`✅ Fiche validée par ${nomManager}`);
        this.loadFichesCompletees();
        this.fermerDetail();
      }
    }
  }

  rejeterFiche(fiche: any) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nomManager = `${user.prenom} ${user.nom}`;
    
    const motif = prompt('Motif du rejet:');
    if (motif) {
      const stored = localStorage.getItem('fiches_intervention');
      const toutes = stored ? JSON.parse(stored) : [];
      
      const index = toutes.findIndex((f: any) => f.id === fiche.id);
      if (index !== -1) {
        toutes[index].rejetePar = nomManager;
        toutes[index].motifRejet = motif;
        toutes[index].dateRejet = new Date().toISOString();
        toutes[index].statut = 'EN_COURS'; // Revient à EN_COURS pour que le technicien rectifie
        
        localStorage.setItem('fiches_intervention', JSON.stringify(toutes));
        
        alert(`❌ Fiche rejetée - Motif: ${motif}`);
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
}