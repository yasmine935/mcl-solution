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
  
  private _currentPage = 'home';
  get currentPage(): string {
    return this._currentPage;
  }
  set currentPage(value: string) {
    this.fermerDetailReclamation();
    this._currentPage = value;
  }

  showCongeForm = false;
  showReclamationDetailModal = false;
  showReclamationForm = false;

  interventions: any[] = [];
  interventionsCompletees: any[] = [];
  conges: any[] = [];
  reclamations: any[] = [];
  photosReclamation: any[] = [];
  selectedReclamation: any = null;

  reclamation = { sujet: '', description: '' };
  conge = { dateDebut: '', dateFin: '', type: '', motif: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadInterventions();
    this.loadConges();
    this.loadReclamations();
  }

  loadInterventions() {
    const stored = localStorage.getItem('interventions');
    const allInterventions = stored ? JSON.parse(stored) : [];
    
    this.interventions = allInterventions.filter((i: any) => 
      i.technicienId === this.user.id && i.statut === 'EN_COURS'
    );
    
    this.interventionsCompletees = allInterventions.filter((i: any) => 
      i.technicienId === this.user.id && i.statut === 'COMPLETEE'
    );
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadReclamations() {
    const stored = localStorage.getItem('reclamations');
    const toutesReclamations = stored ? JSON.parse(stored) : [];
    this.reclamations = toutesReclamations.filter((r: any) => 
      r.technicienId === this.user.id
    );
  }

  getCountInterventionsEnCours(): number {
    return this.interventions.length;
  }

  getCountInterventionsCompletees(): number {
    return this.interventionsCompletees.length;
  }

  getCountReclamations(): number {
    return this.reclamations.length;
  }

  deposerConge() {
    const demande = {
      ...this.conge,
      utilisateur: { id: this.user.id },
      manager: { id: 3 } // KIA
    };
    this.http.post('http://localhost:8080/api/conges', demande)
      .subscribe(() => {
        this.loadConges();
        this.showCongeForm = false;
        this.conge = { dateDebut: '', dateFin: '', type: '', motif: '' };
      }, error => console.error('Erreur envoi congé', error));
  }

  ouvrirDetailReclamation(reclamation: any) {
    this.selectedReclamation = reclamation;
    this.showReclamationDetailModal = true;
  }

  fermerDetailReclamation() {
    this.showReclamationDetailModal = false;
    this.selectedReclamation = null;
  }

  ouvrirFiche(fichId: number) {
    this.router.navigate(['/fiche-intervention-tech', fichId]);
  }

  onPhotoSelectReclamation(event: any) {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photosReclamation.push({
          nom: file.name,
          data: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  supprimerPhotoReclamation(index: number) {
    this.photosReclamation.splice(index, 1);
  }

  envoyerReclamationAvecPhotos() {
    if (!this.reclamation.sujet || !this.reclamation.description) {
      alert('Veuillez remplir sujet et description');
      return;
    }

    const idIncrement = Math.max(...this.reclamations.map(r => r.id || 0), 0) + 1;
    const nouvelleReclamation = {
      id: idIncrement,
      sujet: this.reclamation.sujet,
      description: this.reclamation.description,
      technicienId: this.user.id,
      technicienNom: `${this.user.prenom} ${this.user.nom}`,
      photos: this.photosReclamation,
      statut: 'EN_ATTENTE',
      dateCreation: new Date().toISOString()
    };

    this.reclamations.push(nouvelleReclamation);
    const allReclamations = JSON.parse(localStorage.getItem('reclamations') || '[]');
    allReclamations.push(nouvelleReclamation);
    localStorage.setItem('reclamations', JSON.stringify(allReclamations));

    this.reclamation = { sujet: '', description: '' };
    this.photosReclamation = [];
    this.showReclamationForm = false;
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home': return 'Mon Dashboard';
      case 'interventions': return 'Mes Interventions';
      case 'completees': return 'Interventions Complétées';
      case 'conges': return 'Mes Congés';
      case 'reclamations': return 'Mes Réclamations';
      default: return 'Dashboard Technicien';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}