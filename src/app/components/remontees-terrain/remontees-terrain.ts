import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API = 'http://localhost:8080/api/reclamations-sse';

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
  gravite: 'Faible' | 'Moyen' | 'Grave' | '';
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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
   this.isManager = this.currentUser.role !== 'TECHNICIEN';
    this.loadFiches();
  }

  // ✅ GET depuis backend
  loadFiches() {
    const url = this.isManager ? API : `${API}/technicien/${this.currentUser.id}`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => this.fiches = data.map(f => this.mapFromBackend(f)),
      error: () => this.fiches = []
    });
  }

  mapFromBackend(f: any): FicheSSE {
    return {
      id: f.id?.toString(),
      numero: f.numero,
      dateCreation: f.dateCreation,
      technicienId: f.technicien?.id?.toString(),
      technicienNom: f.technicien ? `${f.technicien.prenom} ${f.technicien.nom}` : '',
      typeSituationDangereuse: f.typeSituationDangereuse || false,
      typePresquAccident: f.typePresquAccident || false,
      typeSuggestion: f.typeSuggestion || false,
      date: f.date,
      heure: f.heure,
      lieu: f.lieu,
      entrepriseConcernee: f.entrepriseConcernee,
      descriptionFaits: f.descriptionFaits,
      gravite: f.gravite || '',
      mesureImmediate: f.mesureImmediate,
      analyseCauses: f.analyseCauses,
      actionCorrective: f.actionCorrective,
      responsableAction: f.responsableAction,
      echeance: f.echeance,
      informationDeclarant: f.informationDeclarant,
      photos: f.photos || [],
      statut: f.statut
    };
  }

  ouvrirNouveau() {
    this.form = {
      typeSituationDangereuse: false, typePresquAccident: false, typeSuggestion: false,
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toTimeString().substring(0, 5),
      lieu: '', entrepriseConcernee: '', descriptionFaits: '',
      gravite: '', mesureImmediate: '',
      analyseCauses: '', actionCorrective: '', responsableAction: '', echeance: '',
      informationDeclarant: null, photos: [], statut: 'EN_ATTENTE'
    };
    this.photosTemp = [];
    this.view = 'nouveau';
  }

  onPhotoSelect(event: any) {
    const files = event.target.files;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (e: any) => this.photosTemp.push({ nom: file.name, data: e.target.result });
      reader.readAsDataURL(file);
    });
  }

  supprimerPhoto(index: number) { this.photosTemp.splice(index, 1); }

  // ✅ POST vers backend
  soumettre() {
  if (!this.form.descriptionFaits || !this.form.lieu || !this.form.date) {
    alert('Veuillez remplir les champs obligatoires (*)');
    return;
  }
  if (!this.form.typeSituationDangereuse && !this.form.typePresquAccident && !this.form.typeSuggestion) {
    alert('Veuillez choisir au moins un type de signalement');
    return;
  }

  const body = {
    ...this.form,
    photos: this.photosTemp,  // ✅ inclure les photos
    technicien: { id: this.currentUser.id },
    statut: 'EN_ATTENTE'
  };

  this.http.post<any>(API, body).subscribe({
    next: (fiche) => {
      this.fiches.unshift(this.mapFromBackend(fiche));
      this.view = 'liste';
      alert(`✅ Fiche ${fiche.numero} envoyée !`);
    },
    error: () => alert('❌ Erreur envoi fiche')
  });
}

  voirDetail(fiche: FicheSSE) {
    this.selectedFiche = { ...fiche };
    this.view = 'detail';
  }

  // ✅ PUT encadrement
  sauvegarderEncadrement() {
    if (!this.selectedFiche) return;
    const body = {
      analyseCauses: this.selectedFiche.analyseCauses,
      actionCorrective: this.selectedFiche.actionCorrective,
      responsableAction: this.selectedFiche.responsableAction,
      echeance: this.selectedFiche.echeance,
      informationDeclarant: this.selectedFiche.informationDeclarant
    };
    this.http.put(`${API}/${this.selectedFiche.id}/encadrement`, body).subscribe({
      next: () => { this.loadFiches(); alert('✅ Encadrement sauvegarde !'); },
      error: () => alert('❌ Erreur')
    });
  }

  // ✅ PUT statut
  changerStatut(fiche: FicheSSE, statut: FicheSSE['statut']) {
  this.http.put(`${API}/${fiche.id}/statut?statut=${statut}`, {}).subscribe({
    next: () => {
      // ✅ Force Angular à détecter le changement
      this.selectedFiche = null;
      setTimeout(() => {
        fiche.statut = statut;
        this.selectedFiche = { ...fiche };
        this.loadFiches();
      }, 50);
    },
    error: () => alert('Erreur')
  });
}

  // ✅ DELETE
  supprimerFiche(fiche: FicheSSE) {
    if (confirm(`Supprimer la fiche ${fiche.numero} ?`)) {
      this.http.delete(`${API}/${fiche.id}`).subscribe({
        next: () => { this.loadFiches(); this.view = 'liste'; },
        error: () => alert('❌ Erreur suppression')
      });
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