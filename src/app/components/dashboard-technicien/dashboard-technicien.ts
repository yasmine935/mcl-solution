import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule
  ],
  templateUrl: './dashboard-technicien.html',
  styleUrl: './dashboard-technicien.css'
})
export class DashboardTechnicien implements OnInit {
  user: any = {};
  currentPage = 'home';
  showCongeForm = false;
  showReclamationForm = false;

  interventions: any[] = [];
  conges: any[] = [];
  reclamations: any[] = [];
  photosReclamation: any[] = [];

  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
  reclamation = { sujet: '', description: '', photos: [] };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadConges();
    this.loadInterventions();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadInterventions() {
    // Récupère les interventions depuis le localStorage (mode MOCK)
    const stored = localStorage.getItem('interventions');
    const allInterventions = stored ? JSON.parse(stored) : [];
    
    // Filtre pour ce technicien
    this.interventions = allInterventions.filter((i: any) => 
      i.statut === 'EN_COURS' || i.statut === 'COMPLETEE'
    );
  }

  deposerConge() {
    const demande = {
      ...this.conge,
      utilisateur: { id: this.user.id }
    };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur', error));
  }

  onPhotoSelectReclamation(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photosReclamation.push({
            nom: files[i].name,
            data: e.target.result
          });
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  supprimerPhotoReclamation(index: number) {
    this.photosReclamation.splice(index, 1);
  }

  envoyerReclamationAvecPhotos() {
    this.reclamations.push({
      id: Date.now(),
      ...this.reclamation,
      photos: this.photosReclamation,
      statut: 'EN_ATTENTE',
      dateCreation: new Date()
    });
    this.showReclamationForm = false;
    this.reclamation = { sujet: '', description: '', photos: [] };
    this.photosReclamation = [];
    alert('Réclamation envoyée avec photos ! ✅');
  }

  ouvrirFiche(id: number) {
    this.router.navigate(['/fiche-intervention-tech', id]);
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'interventions': return 'Mes Interventions';
      case 'conges': return 'Mes Congés';
      case 'fiche': return 'Ma Fiche de Travail';
      case 'reclamation': return 'Mes Réclamations';
      default: return 'Dashboard';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}