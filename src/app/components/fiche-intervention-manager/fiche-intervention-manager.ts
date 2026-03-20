import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InterventionsService } from '../../services/interventions.service';

@Component({
  selector: 'app-fiche-intervention-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule
  ],
  templateUrl: './fiche-intervention-manager.html',
  styleUrl: './fiche-intervention-manager.css'
})
export class FicheInterventionManager implements OnInit {
  showForm = false;
  showEnvoyerModal = false;
  interventions: any[] = [];
  techniciens: any[] = [];
  clients: any[] = [];
  selectedTechnicienForSending: any = null;
  interventionToSend: any = null;

  intervention = {
    numeroProjet: '',
    client: '',
    codeClient: '',
    dateProjet: '',
    dateIntervention: '',
    statut: 'EN_PREPARATION',
    adresse: '',
    numTel: '',
    contactSurSite: '',
    intervenants: '',
    sousTraitant: false,
    interim: false,
    materielHorsStandard: '',
    articlesStock: '',
    articlesCommander: '',
    planPrevention: false,
    ficheSecurity: false,
    docPdP: false,
    docFdS: false,
    taches: {
      installationCameras: false,
      misEnPlaceSupportMural: false,
      fixationTV: false,
      connectique: false,
      testValidation: false
    }
  };
  currentTab = 'creation'; // 'creation' ou 'completees'
getInterventiionsCompletees() {
  return this.interventions.filter(i => i.statut === 'COMPLETEE');
}
  constructor(
    private interventionsService: InterventionsService,
    private http: HttpClient
  ) {}
ouvrirDetailFiche(fiche: any) {
  this.selectedFiche = fiche;
  this.showDetailModal = true;
}

fermerDetailModal() {
  this.showDetailModal = false;
  this.selectedFiche = null;
}
  ngOnInit() {
    this.loadData();
  }
showDetailModal = false;
selectedFiche: any = null;
  loadData() {
    this.interventionsService.getInterventions()
      .subscribe(data => this.interventions = data, error => this.interventions = []);
    
    this.interventionsService.getTechniciens()
      .subscribe(data => this.techniciens = data, error => this.techniciens = []);
    
    this.interventionsService.getClients()
      .subscribe(data => this.clients = data, error => this.clients = []);
  }

  creerIntervention() {
    const demande = {
      ...this.intervention,
      dateCreation: new Date(),
      statut: 'EN_PREPARATION'
    };

    this.interventionsService.creerIntervention(demande)
      .subscribe(() => {
        this.loadData();
        this.showForm = false;
        this.resetForm();
        alert('Fiche d\'intervention créée !');
      }, error => console.error('Erreur création', error));
  }

  openEnvoyerModal(id: number) {
    this.interventionToSend = this.interventions.find(i => i.id === id);
    this.showEnvoyerModal = true;
  }

  envoyerAuTechnicien() {
    if (!this.selectedTechnicienForSending || !this.interventionToSend) {
      alert('Sélectionne un technicien !');
      return;
    }

    this.interventionsService.envoyerAuTechnicien(
      this.interventionToSend.id,
      this.selectedTechnicienForSending.id
    ).subscribe(() => {
      this.loadData();
      this.showEnvoyerModal = false;
      this.selectedTechnicienForSending = null;
      this.interventionToSend = null;
      alert('Fiche envoyée au technicien ! ✅');
    }, error => console.error('Erreur envoi', error));
  }

  fermerModal() {
    this.showEnvoyerModal = false;
    this.selectedTechnicienForSending = null;
    this.interventionToSend = null;
  }

  resetForm() {
    this.intervention = {
      numeroProjet: '',
      client: '',
      codeClient: '',
      dateProjet: '',
      dateIntervention: '',
      statut: 'EN_PREPARATION',
      adresse: '',
      numTel: '',
      contactSurSite: '',
      intervenants: '',
      sousTraitant: false,
      interim: false,
      materielHorsStandard: '',
      articlesStock: '',
      articlesCommander: '',
      planPrevention: false,
      ficheSecurity: false,
      docPdP: false,
      docFdS: false,
      taches: {
        installationCameras: false,
        misEnPlaceSupportMural: false,
        fixationTV: false,
        connectique: false,
        testValidation: false
      }
    };
  }
}