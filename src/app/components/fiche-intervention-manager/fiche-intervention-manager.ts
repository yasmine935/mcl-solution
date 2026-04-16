import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

const API = 'http://localhost:8080/api/fiches-intervention';

@Component({
  selector: 'app-fiche-intervention-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './fiche-intervention-manager.html',
  styleUrl: './fiche-intervention-manager.css'
})
export class FicheInterventionManager implements OnInit {
  fiches: any[] = [];
  employes: any[] = [];
  techniciens: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  ficheEnEdition: any = null;
  currentUser: any = {};

  optionsTaches: any = {
    'Installation des cameras': ['Camera HD 4K', 'Camera IP', 'Camera Thermique', 'Camera PTZ'],
    'Mise en place support mural': ['Support universel', 'Support motorise', 'Support articule', 'Support fixe'],
    'Fixation TV 65 sur Support': ['Support fixe', 'Support articule', 'Support motorise', 'Bras extensible'],
    'Connectique et Parametrage': ['HDMI 2.1', 'Ethernet', 'WiFi 6', 'Fiber Optique', 'USB-C'],
    'Test et Validation': ['Test video', 'Test audio', 'Test reseau', 'Test securite', 'Validation client']
  };

  tachesDisponibles = [
    'Installation des cameras', 'Mise en place support mural',
    'Fixation TV 65 sur Support', 'Connectique et Parametrage', 'Test et Validation'
  ];

  nouvelleFiche: any = {
    numProjet: '', client: '', date: null, technicienAssigne: '',
    description: '', codeClient: '', numCommande: '', chiffreAffaire: 0,
    adresse: '', contact: '', materielsHorsStandard: [],
    nouveauMateriel: '', documentsImportes: [], taches: []
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadEmployes();
    this.loadFiches();
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => {
        this.employes = data;
        this.techniciens = data.filter((e: any) => e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP');
        localStorage.setItem('employes', JSON.stringify(data));
      },
      error: () => {
        const stored = localStorage.getItem('employes');
        this.employes = stored ? JSON.parse(stored) : [];
        this.techniciens = this.employes.filter((e: any) => e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP');
      }
    });
  }

  loadFiches() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        this.fiches = data.map(f => this.mapFromBackend(f));
        localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
      },
      error: () => {
        const stored = localStorage.getItem('fiches_intervention');
        this.fiches = stored ? JSON.parse(stored) : [];
      }
    });
  }

  mapFromBackend(f: any): any {
    return {
      id: f.id,
      numProjet: f.numProjet,
      client: f.client,
      dateIntervention: f.dateIntervention,
      date: f.dateIntervention ? new Date(f.dateIntervention) : null,
      technicienAssigne: f.technicien ? `${f.technicien.prenom} ${f.technicien.nom}` : '',
      technicienId: f.technicien?.id,
      description: f.description,
      adresse: f.adresse,
      contact: f.contact,
      statut: f.statut,
      heureDebut: f.heureDebut,
      heureFin: f.heureFin,
      materielsHorsStandard: [],
      documentsImportes: [],
      taches: []
    };
  }

  formatDate(date: any): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  afficherDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  ajouterFiche() {
    if (!this.nouvelleFiche.numProjet || !this.nouvelleFiche.client) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const tech = this.techniciens.find((t: any) => `${t.prenom} ${t.nom}` === this.nouvelleFiche.technicienAssigne);
    const body = {
      numProjet: this.nouvelleFiche.numProjet,
      client: this.nouvelleFiche.client,
      adresse: this.nouvelleFiche.adresse,
      contact: this.nouvelleFiche.contact,
      dateIntervention: this.formatDate(this.nouvelleFiche.date),
      description: this.nouvelleFiche.description,
      statut: 'EN_COURS',
      technicien: tech ? { id: tech.id } : null,
      manager: { id: this.currentUser.id }
    };
    this.http.post<any>(API, body).subscribe({
      next: (fiche) => {
        this.fiches.push(this.mapFromBackend(fiche));
        localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
        alert('Fiche creee et envoyee au technicien !');
        this.resetFormAdd();
        this.showFormAdd = false;
      },
      error: () => alert('Erreur creation fiche')
    });
  }

  ouvrirEdition(fiche: any) {
    this.ficheEnEdition = JSON.parse(JSON.stringify(fiche));
    if (this.ficheEnEdition.date && typeof this.ficheEnEdition.date === 'string') {
      this.ficheEnEdition.date = new Date(this.ficheEnEdition.date);
    }
    this.showFormEdit = true;
  }

  modifierFiche() {
    if (!this.ficheEnEdition.numProjet) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const tech = this.techniciens.find((t: any) => `${t.prenom} ${t.nom}` === this.ficheEnEdition.technicienAssigne);
    const body = {
      numProjet: this.ficheEnEdition.numProjet,
      client: this.ficheEnEdition.client,
      adresse: this.ficheEnEdition.adresse,
      contact: this.ficheEnEdition.contact,
      dateIntervention: this.formatDate(this.ficheEnEdition.date),
      description: this.ficheEnEdition.description,
      statut: this.ficheEnEdition.statut,
      technicien: tech ? { id: tech.id } : null
    };
    this.http.put<any>(`${API}/${this.ficheEnEdition.id}`, body).subscribe({
      next: (fiche) => {
        const index = this.fiches.findIndex((f: any) => f.id === this.ficheEnEdition.id);
        if (index !== -1) this.fiches[index] = this.mapFromBackend(fiche);
        localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
        this.showFormEdit = false;
        this.ficheEnEdition = null;
      },
      error: () => alert('Erreur modification')
    });
  }

  supprimerFiche(id: number) {
    if (confirm('Supprimer cette fiche ?')) {
      this.http.delete(`${API}/${id}`).subscribe({
        next: () => {
          this.fiches = this.fiches.filter((f: any) => f.id !== id);
          localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
        },
        error: () => alert('Erreur suppression')
      });
    }
  }

  resetFormAdd() {
    this.nouvelleFiche = {
      numProjet: '', client: '', date: null, technicienAssigne: '',
      description: '', codeClient: '', numCommande: '', chiffreAffaire: 0,
      adresse: '', contact: '', materielsHorsStandard: [],
      nouveauMateriel: '', documentsImportes: [], taches: []
    };
  }

  resetFormEdit() { this.ficheEnEdition = null; this.showFormEdit = false; }

  ajouterMateriel(form: any) {
    if (form.nouveauMateriel?.trim()) {
      if (!form.materielsHorsStandard) form.materielsHorsStandard = [];
      form.materielsHorsStandard.push(form.nouveauMateriel);
      form.nouveauMateriel = '';
    }
  }

  supprimerMateriel(form: any, index: number) { form.materielsHorsStandard.splice(index, 1); }

  onFileSelectDocuments(event: any, form: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        form.documentsImportes.push({
          nom: files[i].name.replace(/\.[^/.]+$/, ''),
          type: 'file',
          taille: (files[i].size / 1024).toFixed(2),
          dateAjout: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  supprimerDocument(form: any, index: number) { form.documentsImportes.splice(index, 1); }

  ajouterTache(form: any, tache: string) {
    if (!form.taches) form.taches = [];
    if (!form.taches.some((t: any) => t.nom === tache)) {
      form.taches.push({ nom: tache, coche: false, selection: '' });
    }
  }

  supprimerTache(form: any, index: number) { form.taches.splice(index, 1); }
  getOptionsTache(nomTache: string): string[] { return this.optionsTaches[nomTache] || []; }
  tacheExiste(form: any, nomTache: string): boolean {
    return form.taches?.some((t: any) => t.nom === nomTache) || false;
  }
}