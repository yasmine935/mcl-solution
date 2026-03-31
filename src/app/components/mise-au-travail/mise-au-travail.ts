import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface FicheMiseAuTravail {
  id: string;
  numero: string;
  dateCreation: string;
  // Identification
  chantierZone: string;
  date: string;
  heure: string;
  entreprisesIntervenantes: string;
  responsableIntervention: string;
  // A. Analyse de la tâche
  descriptionActivite: string;
  modesOperatoiresValides: boolean | null;
  coActiviteIdentifiee: boolean | null;
  coActivitePrecision: string;
  permisSpecifiques: boolean | null;
  permisSpecifiquesPrecision: string;
  // B. Risques
  risquesEnvironnement: boolean;
  risquesTache: boolean;
  protectionsCollectives: boolean;
  epiSpecifiques: boolean;
  // C. Consignes urgence
  moyensAlerte: boolean;
  secours: boolean;
  nomSST: string;
  evacuation: boolean;
  // D. Validation équipe
  membres: { nom: string; entreprise: string; signature: string }[];
  // Meta
  statut: 'Brouillon' | 'Validée' | 'Archivée';
  creePar: string;
}

@Component({
  selector: 'app-mise-au-travail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './mise-au-travail.html',
  styleUrl: './mise-au-travail.css'
})
export class MiseAuTravail implements OnInit {

  currentUser: any = null;
  view: 'liste' | 'nouveau' | 'detail' = 'liste';
  fiches: FicheMiseAuTravail[] = [];
  selectedFiche: FicheMiseAuTravail | null = null;

  form: Partial<FicheMiseAuTravail> = {};

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadFiches();
  }

  loadFiches() {
    const stored = localStorage.getItem('fichesMiseAuTravail');
    this.fiches = stored ? JSON.parse(stored) : [];
  }

  saveFiches() {
    localStorage.setItem('fichesMiseAuTravail', JSON.stringify(this.fiches));
  }

  ouvrirNouveau() {
    this.form = {
      chantierZone: '', date: '', heure: '',
      entreprisesIntervenantes: '', responsableIntervention: '',
      descriptionActivite: '',
      modesOperatoiresValides: null,
      coActiviteIdentifiee: null, coActivitePrecision: '',
      permisSpecifiques: null, permisSpecifiquesPrecision: '',
      risquesEnvironnement: false, risquesTache: false,
      protectionsCollectives: false, epiSpecifiques: false,
      moyensAlerte: false, secours: false, nomSST: '', evacuation: false,
      membres: [
        { nom: '', entreprise: '', signature: '' },
        { nom: '', entreprise: '', signature: '' },
        { nom: '', entreprise: '', signature: '' },
      ],
      statut: 'Brouillon',
      creePar: `${this.currentUser.prenom} ${this.currentUser.nom}`
    };
    this.view = 'nouveau';
  }

  soumettre(statut: 'Brouillon' | 'Validée') {
    if (!this.form.chantierZone || !this.form.date || !this.form.responsableIntervention) {
      alert('Veuillez remplir les champs obligatoires (*)');
      return;
    }
    const nouvelle: FicheMiseAuTravail = {
      ...this.form as FicheMiseAuTravail,
      id: Date.now().toString(),
      numero: 'MAT-' + String(this.fiches.length + 1).padStart(4, '0'),
      dateCreation: new Date().toISOString(),
      statut
    };
    this.fiches.unshift(nouvelle);
    this.saveFiches();
    this.view = 'liste';
    alert(`✅ Fiche ${nouvelle.numero} ${statut === 'Validée' ? 'validée' : 'sauvegardée'} !`);
  }

  voirDetail(fiche: FicheMiseAuTravail) {
    this.selectedFiche = fiche;
    this.view = 'detail';
  }

  validerFiche(fiche: FicheMiseAuTravail) {
    fiche.statut = 'Validée';
    this.saveFiches();
  }

  archiverFiche(fiche: FicheMiseAuTravail) {
    fiche.statut = 'Archivée';
    this.saveFiches();
  }

  supprimerFiche(fiche: FicheMiseAuTravail) {
    if (confirm(`Supprimer la fiche ${fiche.numero} ?`)) {
      this.fiches = this.fiches.filter(f => f.id !== fiche.id);
      this.saveFiches();
      this.view = 'liste';
    }
  }

  ajouterMembre() {
    if (!this.form.membres) this.form.membres = [];
    this.form.membres.push({ nom: '', entreprise: '', signature: '' });
  }

  supprimerMembre(index: number) {
    this.form.membres?.splice(index, 1);
  }

  retour() {
    this.view = 'liste';
    this.selectedFiche = null;
  }

  getStatutClass(statut: string): string {
    const map: any = {
      'Brouillon': 'statut-brouillon',
      'Validée': 'statut-validee',
      'Archivée': 'statut-archivee'
    };
    return map[statut] || '';
  }

  get fichesBrouillon() { return this.fiches.filter(f => f.statut === 'Brouillon'); }
  get fichesValidees() { return this.fiches.filter(f => f.statut === 'Validée'); }
  get fichesArchivees() { return this.fiches.filter(f => f.statut === 'Archivée'); }
}