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
  showReclamationDetailModal = false;
  selectedReclamation: any = null;

  interventions: any[] = [];
  interventionsCompletees: any[] = [];
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
    this.loadReclamations();
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadInterventions() {
    const stored = localStorage.getItem('interventions');
    const allInterventions = stored ? JSON.parse(stored) : [];
    
    this.interventions = allInterventions.filter((i: any) => 
      i.statut === 'EN_COURS'
    );
    
    this.interventionsCompletees = allInterventions.filter((i: any) => 
      i.statut === 'COMPLETEE'
    );
  }

  loadReclamations() {
    const stored = localStorage.getItem('reclamations');
    const toutesReclamations = stored ? JSON.parse(stored) : [];
    this.reclamations = toutesReclamations.filter((r: any) => 
      r.technicienId === this.user.id
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
    const nouvelleReclamation = {
      id: Date.now(),
      ...this.reclamation,
      photos: this.photosReclamation,
      statut: 'EN_ATTENTE',
      dateCreation: new Date(),
      technicienId: this.user.id,
      technicienNom: this.user.prenom + ' ' + this.user.nom
    };
    
    this.reclamations.push(nouvelleReclamation);
    
    const toutesReclamations = JSON.parse(localStorage.getItem('reclamations') || '[]');
    toutesReclamations.push(nouvelleReclamation);
    localStorage.setItem('reclamations', JSON.stringify(toutesReclamations));
    
    this.showReclamationForm = false;
    this.reclamation = { sujet: '', description: '', photos: [] };
    this.photosReclamation = [];
    alert('Réclamation envoyée avec photos ! ✅');
  }

  ouvrirDetailReclamation(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.showReclamationDetailModal = true;
  }

  fermerDetailReclamation() {
    this.showReclamationDetailModal = false;
    this.selectedReclamation = null;
  }

  ouvrirFiche(id: number) {
    this.router.navigate(['/fiche-intervention-tech', id]);
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'interventions': return 'Mes Interventions';
      case 'completees': return 'Interventions Complétées';
      case 'conges': return 'Mes Congés';
      case 'reclamations': return 'Mes Réclamations';
      default: return 'Dashboard';
    }
  }

  getCountInterventionsEnCours(): number {
    return this.interventions.length;
  }

  getCountInterventionsCompletees(): number {
    return this.interventionsCompletees.length;
  }

  getCountReclamations(): number {
    return this.reclamations.filter(r => r.statut === 'EN_ATTENTE').length;
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}