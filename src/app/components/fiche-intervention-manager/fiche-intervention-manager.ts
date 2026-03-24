import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-fiche-intervention-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './fiche-intervention-manager.html',
  styleUrl: './fiche-intervention-manager.css'
})
export class FicheInterventionManager implements OnInit {
  fiches: any[] = [];
  employes: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  ficheEnEdition: any = null;

  // Options pour chaque type de tâche
  optionsTaches: any = {
    'Installation des caméras': ['Camera HD 4K', 'Camera IP', 'Camera Thermique', 'Camera PTZ'],
    'Mise en place support mural': ['Support universel', 'Support motorisé', 'Support articule', 'Support fixe'],
    'Fixation TV 65" sur Support': ['Support fixe', 'Support articulé', 'Support motorisé', 'Bras extensible'],
    'Connectique et Paramétrage': ['HDMI 2.1', 'Ethernet', 'WiFi 6', 'Fiber Optique', 'USB-C'],
    'Test et Validation': ['Test vidéo', 'Test audio', 'Test réseau', 'Test sécurité', 'Validation client']
  };

  // TECHNICIENS CHARGÉS DEPUIS EMPLOYES
  techniciens: any[] = [];

  nouvelleFiche = {
    numProjet: '',
    client: '',
    date: '',
    technicienAssigne: '',
    description: '',
    // INFO CLIENT
    codeClient: '',
    numCommande: '',
    adresse: '',
    contact: '',
    // MATÉRIEL HORS STANDARD
    materielsHorsStandard: [] as any[],
    nouveauMateriel: '',
    // DOCUMENTS
    documentsImportes: [] as any[],
    // TÂCHES
    taches: [] as any[]
  };

  tachesDisponibles = [
    'Installation des caméras',
    'Mise en place support mural',
    'Fixation TV 65" sur Support',
    'Connectique et Paramétrage',
    'Test et Validation'
  ];

  constructor() {}

  ngOnInit() {
    this.loadEmployes();
    this.loadFiches();
  }

  loadEmployes() {
    const stored = localStorage.getItem('employes');
    this.employes = stored ? JSON.parse(stored) : [];
    
    // ✅ CHARGER LES VRAIS TECHNICIENS DEPUIS EMPLOYES
    this.techniciens = this.employes
      .filter((emp: any) => emp.role === 'TECHNICIEN' || emp.role === 'TECHNICIEN_SUP')
      .map((emp: any) => `${emp.prenom} ${emp.nom}`);
  }

  loadFiches() {
    const stored = localStorage.getItem('fiches_intervention');
    this.fiches = stored ? JSON.parse(stored) : [
      { id: 1, numProjet: 'PRJ-001', client: 'Acme Corp', date: '25/03/2026', technicienAssigne: 'Test Technicien', description: 'Installation complète salle de réunion', codeClient: 'CLI-001', numCommande: 'CMD-2025-001', adresse: '123 Rue de Paris, 75001 Paris', contact: 'Jean Dupont - 01 23 45 67 89', materielsHorsStandard: ['Nacelle'], documentsImportes: [], taches: [] }
    ];
  }

  ajouterFiche() {
    if (!this.nouvelleFiche.numProjet || !this.nouvelleFiche.numCommande || !this.nouvelleFiche.adresse || !this.nouvelleFiche.contact) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const idIncrement = Math.max(...this.fiches.map((f: any) => f.id || 0), 0) + 1;

    const fiche = {
      id: idIncrement,
      ...this.nouvelleFiche,
      taches: this.nouvelleFiche.taches.map((t: any) => ({ ...t, coche: false, selection: '' }))
    };

    this.fiches.push(fiche);
    localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));

    alert('✅ Fiche créée et envoyée à ' + this.nouvelleFiche.technicienAssigne + ' !');
    this.resetFormAdd();
    this.showFormAdd = false;
  }

  ouvrirEdition(fiche: any) {
    this.ficheEnEdition = JSON.parse(JSON.stringify(fiche));
    this.showFormEdit = true;
  }

  modifierFiche() {
    if (!this.ficheEnEdition.numProjet || !this.ficheEnEdition.numCommande || !this.ficheEnEdition.adresse || !this.ficheEnEdition.contact) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const index = this.fiches.findIndex((f: any) => f.id === this.ficheEnEdition.id);
    if (index !== -1) {
      this.fiches[index] = this.ficheEnEdition;
      localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  supprimerFiche(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) {
      this.fiches = this.fiches.filter((f: any) => f.id !== id);
      localStorage.setItem('fiches_intervention', JSON.stringify(this.fiches));
    }
  }

  resetFormAdd() {
    this.nouvelleFiche = {
      numProjet: '',
      client: '',
      date: '',
      technicienAssigne: '',
      description: '',
      codeClient: '',
      numCommande: '',
      adresse: '',
      contact: '',
      materielsHorsStandard: [] as any[],
      nouveauMateriel: '',
      documentsImportes: [] as any[],
      taches: []
    };
  }

  resetFormEdit() {
    this.ficheEnEdition = null;
  }

  // ===== MATÉRIEL HORS STANDARD =====
  ajouterMateriel(form: any) {
    if (form.nouveauMateriel && form.nouveauMateriel.trim()) {
      if (!form.materielsHorsStandard) {
        form.materielsHorsStandard = [];
      }
      form.materielsHorsStandard.push(form.nouveauMateriel);
      form.nouveauMateriel = '';
    }
  }

  supprimerMateriel(form: any, index: number) {
    form.materielsHorsStandard.splice(index, 1);
  }

  // ===== DOCUMENTS IMPORT =====
  onFileSelectDocuments(event: any, form: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        form.documentsImportes.push({
          nom: file.name.replace(/\.[^/.]+$/, ''),
          type: 'file',
          taille: (file.size / 1024).toFixed(2),
          dateAjout: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  supprimerDocument(form: any, index: number) {
    form.documentsImportes.splice(index, 1);
  }

  // ===== TÂCHES AVEC SÉLECTION =====
  ajouterTache(form: any, tache: string) {
    if (!form.taches) {
      form.taches = [];
    }
    
    const tacheExiste = form.taches.some((t: any) => t.nom === tache);
    if (!tacheExiste) {
      form.taches.push({
        nom: tache,
        coche: false,
        selection: ''
      });
    }
  }

  supprimerTache(form: any, index: number) {
    form.taches.splice(index, 1);
  }

  getOptionsTache(nomTache: string): string[] {
    return this.optionsTaches[nomTache] || [];
  }

  tacheExiste(form: any, nomTache: string): boolean {
    if (!form.taches) {
      return false;
    }
    return form.taches.some((t: any) => t.nom === nomTache);
  }
}