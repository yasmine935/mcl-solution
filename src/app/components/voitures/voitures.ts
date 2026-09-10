import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoituresApi } from '../../services/api/apis';

@Component({
  selector: 'app-voitures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voitures.html',
  styleUrl: './voitures.css'
})
export class Voitures implements OnInit {

  voitures: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  selectedVoiture: any = null;
  currentUser: any = {};

  statutsVoiture = ['Disponible', 'En service', 'En maintenance', 'Hors service'];
  carburants = ['Essence', 'Diesel', 'Electrique', 'Hybride'];

  nouvelleVoiture = {
    immatriculation: '', marque: '', modele: '', annee: '',
    kilometrage: '', statut: 'Disponible', conducteur: '',
    prochainControle: '', assurance: '', dateExpirationAssurance: '',
    carburant: 'Diesel'
  };

  voitureEnEdition: any = {};

  constructor(private voituresApi: VoituresApi) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadVoitures();
  }

  loadVoitures() {
    this.voituresApi.lister<any>().subscribe({
      next: (data) => this.voitures = data,
      error: () => this.voitures = []
    });
  }

  ajouterVoiture() {
    if (!this.nouvelleVoiture.immatriculation || !this.nouvelleVoiture.marque) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const body = {
      ...this.nouvelleVoiture,
      prochainControle: this.nouvelleVoiture.prochainControle || null,
      dateExpirationAssurance: this.nouvelleVoiture.dateExpirationAssurance || null
    };
    this.voituresApi.creer<any>(body).subscribe({
      next: (v) => {
        this.voitures.push(v);
        this.resetFormAdd();
        this.showFormAdd = false;
      },
      error: () => alert('❌ Erreur création véhicule')
    });
  }

  ouvrirEdition(voiture: any) {
    this.voitureEnEdition = { ...voiture };
    this.selectedVoiture = voiture;
    this.showFormEdit = true;
  }

  modifierVoiture() {
    if (!this.voitureEnEdition.immatriculation || !this.voitureEnEdition.marque) {
      alert('Champs obligatoires manquants');
      return;
    }
    this.voituresApi.modifier<any>(this.voitureEnEdition.id, this.voitureEnEdition).subscribe({
      next: (v) => {
        const idx = this.voitures.findIndex((x: any) => x.id === v.id);
        if (idx !== -1) this.voitures[idx] = v;
        this.showFormEdit = false;
        this.voitureEnEdition = {};
      },
      error: () => alert('❌ Erreur modification')
    });
  }

  supprimerVoiture(id: number) {
    if (confirm('Supprimer ce véhicule ?')) {
      this.voituresApi.supprimer(id).subscribe({
        next: () => this.voitures = this.voitures.filter((v: any) => v.id !== id),
        error: () => alert('❌ Erreur suppression')
      });
    }
  }

  changerStatut(id: number, statut: string) {
    this.voituresApi.put(`${id}/statut`, {}, { statut }).subscribe({
      next: () => {
        const v = this.voitures.find((x: any) => x.id === id);
        if (v) v.statut = statut;
      },
      error: () => alert('❌ Erreur changement statut')
    });
  }

  resetFormAdd() {
    this.nouvelleVoiture = {
      immatriculation: '', marque: '', modele: '', annee: '',
      kilometrage: '', statut: 'Disponible', conducteur: '',
      prochainControle: '', assurance: '', dateExpirationAssurance: '',
      carburant: 'Diesel'
    };
  }

  getStatutColor(statut: string): string {
    const map: any = {
      'Disponible': '#2e7d32', 'En service': '#1565c0',
      'En maintenance': '#f57f17', 'Hors service': '#c62828'
    };
    return map[statut] || '#546e7a';
  }

  isAssuranceExpiree(date: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getCarburantIcon(carburant: string): string {
    const map: any = {
      'Essence': '⛽', 'Diesel': '🛢️', 'Electrique': '⚡', 'Hybride': '🔋'
    };
    return map[carburant] || '⛽';
  }

  get voituresDisponibles() { return this.voitures.filter(v => v.statut === 'Disponible').length; }
  get voituresEnService() { return this.voitures.filter(v => v.statut === 'En service').length; }
  get voituresEnMaintenance() { return this.voitures.filter(v => v.statut === 'En maintenance').length; }
}