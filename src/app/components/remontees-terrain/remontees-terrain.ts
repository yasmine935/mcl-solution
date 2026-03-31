import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface FicheSSE {
  id: string;
  numero: string;
  dateCreation: string;
  technicienId: string;
  technicienNom: string;
  typeSituationDangereuse: boolean;
  typePresquAccident: boolean;
  typeSuggestion: boolean;
  date: string;
  heure: string;
  lieu: string;
  entrepriseConcernee: string;
  descriptionFaits: string;
  gravite: 'Faible' | 'Moyen' | 'Grave' | '';  // ✅ UN SEUL CHAMP
  mesureImmediate: string;
  analyseCauses: string;
  actionCorrective: string;
  responsableAction: string;
  echeance: string;
  informationDeclarant: boolean | null;
  photos: { nom: string; data: string }[];
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TRAITEE';
}

@Component({
  selector: 'app-remontees-terrain',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './remontees-terrain.html',
  styleUrl: './remontees-terrain.css'
})
export class RemonteesTerrainComponent implements OnInit {

  currentUser: any = null;
  view: 'liste' | 'nouveau' | 'detail' = 'liste';
  fiches: FicheSSE[] = [];
  selectedFiche: FicheSSE | null = null;
  form: Partial<FicheSSE> = {};
  photosTemp: { nom: string; data: string }[] = [];
  isManager = false;

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    // ✅ FERID, ODILE, KIA, AURELIEN voient toutes les fiches
    this.isManager = ['TECHNICIEN_SUP', 'AURELIEN', 'ODILE', 'FERID'].includes(this.currentUser.role);
    this.loadFiches();
  }

  loadFiches() {
    const stored = localStorage.getItem('ficheSSETerrain');
    const all: FicheSSE[] = stored ? JSON.parse(stored) : [];
    if (!this.isManager) {
      this.fiches = all.filter(f => f.technicienId === String(this.currentUser.id));
    } else {
      this.fiches = all;
    }
  }

  ouvrirNouveau() {
    this.form = {
      typeSituationDangereuse: false,
      typePresquAccident: false,
      typeSuggestion: false,
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toTimeString().substring(0, 5),
      lieu: '',
      entrepriseConcernee: '',
      descriptionFaits: '',
      gravite: '',  // ✅ VIDE PAR DÉFAUT
      mesureImmediate: '',
      analyseCauses: '',
      actionCorrective: '',
      responsableAction: '',
      echeance: '',
      informationDeclarant: null,
      photos: [],
      statut: 'EN_ATTENTE'
    };
    this.photosTemp = [];
    this.view = 'nouveau';
  }

  onPhotoSelect(event: any) {
    const files = event.target.files;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photosTemp.push({ nom: file.name, data: e.target.result });
      };
      reader.readAsDataURL(file);
    });
  }

  supprimerPhoto(index: number) {
    this.photosTemp.splice(index, 1);
  }

  soumettre() {
    if (!this.form.descriptionFaits || !this.form.lieu || !this.form.date) {
      alert('Veuillez remplir les champs obligatoires (*)');
      return;
    }
    if (!this.form.typeSituationDangereuse && !this.form.typePresquAccident && !this.form.typeSuggestion) {
      alert('Veuillez choisir au moins un type de signalement');
      return;
    }
    const stored = localStorage.getItem('ficheSSETerrain');
    const all: FicheSSE[] = stored ? JSON.parse(stored) : [];
    const nouvelle: FicheSSE = {
      ...this.form as FicheSSE,
      id: Date.now().toString(),
      numero: 'SSE-' + String(all.length + 1).padStart(4, '0'),
      dateCreation: new Date().toISOString(),
      technicienId: String(this.currentUser.id),
      technicienNom: `${this.currentUser.prenom} ${this.currentUser.nom}`,
      photos: [...this.photosTemp],
      statut: 'EN_ATTENTE'
    };
    all.unshift(nouvelle);
    localStorage.setItem('ficheSSETerrain', JSON.stringify(all));
    this.loadFiches();
    this.view = 'liste';
    alert(`✅ Fiche ${nouvelle.numero} envoyee a l'encadrement !`);
  }

  voirDetail(fiche: FicheSSE) {
    this.selectedFiche = { ...fiche };
    this.view = 'detail';
  }

  sauvegarderEncadrement() {
    if (!this.selectedFiche) return;
    const stored = localStorage.getItem('ficheSSETerrain');
    const all: FicheSSE[] = stored ? JSON.parse(stored) : [];
    const idx = all.findIndex(f => f.id === this.selectedFiche!.id);
    if (idx >= 0) {
      all[idx] = { ...this.selectedFiche };
      localStorage.setItem('ficheSSETerrain', JSON.stringify(all));
      this.loadFiches();
      alert('✅ Partie encadrement sauvegardee !');
    }
  }

  changerStatut(fiche: FicheSSE, statut: FicheSSE['statut']) {
    const stored = localStorage.getItem('ficheSSETerrain');
    const all: FicheSSE[] = stored ? JSON.parse(stored) : [];
    const idx = all.findIndex(f => f.id === fiche.id);
    if (idx >= 0) {
      all[idx].statut = statut;
      localStorage.setItem('ficheSSETerrain', JSON.stringify(all));
      this.loadFiches();
      if (this.selectedFiche?.id === fiche.id) this.selectedFiche.statut = statut;
    }
  }

  supprimerFiche(fiche: FicheSSE) {
    if (confirm(`Supprimer la fiche ${fiche.numero} ?`)) {
      const stored = localStorage.getItem('ficheSSETerrain');
      const all: FicheSSE[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('ficheSSETerrain', JSON.stringify(all.filter(f => f.id !== fiche.id)));
      this.loadFiches();
      this.view = 'liste';
    }
  }

  retour() { this.view = 'liste'; this.selectedFiche = null; }

  getGraviteClass(gravite: string): string {
    if (gravite === 'Grave') return 'gravite-grave';
    if (gravite === 'Moyen') return 'gravite-moyen';
    if (gravite === 'Faible') return 'gravite-faible';
    return '';
  }

  getStatutClass(statut: string): string {
    const map: any = { 'EN_ATTENTE': 'statut-attente', 'EN_COURS': 'statut-cours', 'TRAITEE': 'statut-traitee' };
    return map[statut] || '';
  }

  get fichesAttente() { return this.fiches.filter(f => f.statut === 'EN_ATTENTE'); }
  get fichesEnCours() { return this.fiches.filter(f => f.statut === 'EN_COURS'); }
  get fichesTraitees() { return this.fiches.filter(f => f.statut === 'TRAITEE'); }
}