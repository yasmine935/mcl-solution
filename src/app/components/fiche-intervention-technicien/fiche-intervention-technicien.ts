import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InterventionsService } from '../../services/interventions.service';

@Component({
  selector: 'app-fiche-intervention-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './fiche-intervention-technicien.html',
  styleUrl: './fiche-intervention-technicien.css'
})
export class FicheInterventionTechnicien implements OnInit {
  intervention: any = {};
  technicienId: number = 0;
  signatureCanvas: any = null;
  photos: any[] = [];

 form = {
  taches: {
    installationCameras: false,
    misEnPlaceSupportMural: false,
    fixationTV: false,
    connectique: false,
    testValidation: false
  },
  dateDebut: '',
  heureDebut: '',
  heureFin: '',
  intervenants: '',
  photos: [],
  signatureTechnicien: ''
};

  constructor(
    private interventionsService: InterventionsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.technicienId = user.id;

    // Récupère l'ID de la fiche depuis la route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadIntervention(parseInt(params['id']));
      } else {
        // Sinon, prend la première intervention disponible (pour test)
        this.loadPremiereFiche();
      }
    });
  }

  loadIntervention(id: number) {
    this.interventionsService.getIntervention(id).subscribe(data => {
      this.intervention = data;
    });
  }

  loadPremiereFiche() {
    this.interventionsService.getInterventionsTechnicien(this.technicienId).subscribe(data => {
      if (data.length > 0) {
        this.intervention = data[0];
      }
    });
  }

  onPhotoSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photos.push({
            nom: files[i].name,
            data: e.target.result
          });
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  supprimerPhoto(index: number) {
    this.photos.splice(index, 1);
  }

  envoyerFiche() {
    const ficheCompletee = {
      ...this.intervention,
      ...this.form,
      statut: 'COMPLETEE',
      dateCompletion: new Date().toISOString()
    };

    this.interventionsService.completerIntervention(this.intervention.id, ficheCompletee)
      .subscribe(() => {
        alert('Fiche envoyée avec succès ! ✅');
        this.router.navigate(['/dashboard-technicien']);
      }, error => console.error('Erreur envoi', error));
  }

  annuler() {
    this.router.navigate(['/dashboard-technicien']);
  }
}