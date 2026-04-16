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
import { Semenier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    Semenier, Planning, RemonteesTerrainComponent
  ],
  templateUrl: './dashboard-technicien.html',
  styleUrl: './dashboard-technicien.css'
})
export class DashboardTechnicien implements OnInit {
  user: any = {};

  private _currentPage = 'home';
  get currentPage(): string { return this._currentPage; }

  set currentPage(value: string) {
    if (value === 'interventions' && !this.minuteDejaFaite) {
      this.showMinuteSecurite = true;
      this.minuteForm.nomSignataire = `${this.user.prenom} ${this.user.nom}`;
      return;
    }
    this._currentPage = value;
  }

  showCongeForm = false;
  interventions: any[] = [];
  interventionsCompletees: any[] = [];
  conges: any[] = [];
  soldeConges: any = null;

  conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '' };
  nombreJours = 0;

  // ✅ Minute Sécurité
  showMinuteSecurite = false;
  minuteDejaFaite = false;

  minuteForm = {
    tacheAEffectuer: '',
    competencesHabilitations: null as boolean | null,
    outilsEquipements: null as boolean | null,
    environnementSecurise: null as boolean | null,
    modeOperatoire: null as boolean | null,
    saitQuoiFaireUrgence: null as boolean | null,
    risquesSpecifiques: '',
    mesurePreventionImmediate: '',
    nomSignataire: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadData();
  }

  loadData() {
    this.loadInterventions();
    this.loadConges();
    this.loadSoldeConges();
  }

  loadInterventions() {
    this.http.get<any[]>('http://localhost:8080/api/fiches-intervention').subscribe({
      next: (data) => {
        const userFullName = `${this.user.prenom} ${this.user.nom}`;
        const mesFiches = data.filter((f: any) =>
          f.technicien && `${f.technicien.prenom} ${f.technicien.nom}` === userFullName
        );
        this.interventions = mesFiches.filter((f: any) => f.statut !== 'COMPLETEE' && f.statut !== 'VALIDEE');
        this.interventionsCompletees = mesFiches.filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE');
        localStorage.setItem('fiches_intervention', JSON.stringify(data));
      },
      error: () => console.error('Erreur chargement interventions')
    });
  }

  loadConges() {
    this.http.get<any[]>(`http://localhost:8080/api/conges/employe/${this.user.id}`)
      .subscribe(data => this.conges = data, error => this.conges = []);
  }

  loadSoldeConges() {
    if (!this.user.id) return;
    this.http.get<any>(`http://localhost:8080/api/conges/solde/${this.user.id}`).subscribe({
      next: (data) => this.soldeConges = data,
      error: () => this.soldeConges = null
    });
  }

  getCountInterventionsEnCours(): number { return this.interventions.length; }
  getCountInterventionsCompletees(): number { return this.interventionsCompletees.length; }

  getCountReclamations(): number {
    const stored = localStorage.getItem('ficheSSETerrain');
    const all = stored ? JSON.parse(stored) : [];
    return all.filter((f: any) => f.technicienId === String(this.user.id)).length;
  }

  deposerConge() {
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 3 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
      this.loadConges();
      this.loadSoldeConges();
      this.showCongeForm = false;
      this.resetCongeForm();
    }, error => console.error('Erreur envoi conge', error));
  }

  calculerNombreJours() {
    if (this.conge.dateDebut && this.conge.dateFin) {
      this.nombreJours = this.calculerJours(this.conge.dateDebut, this.conge.dateFin);
    } else {
      this.nombreJours = 0;
    }
  }

  calculerJours(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return 0;
    return Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  resetCongeForm() {
    this.conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '' };
    this.nombreJours = 0;
  }

  ouvrirFiche(fichId: number) {
    this.router.navigate(['/fiche-intervention-tech', fichId]);
  }

  // ✅ MINUTE SÉCURITÉ
  hasNonResponse(): boolean {
    return this.minuteForm.competencesHabilitations === false ||
           this.minuteForm.outilsEquipements === false ||
           this.minuteForm.environnementSecurise === false ||
           this.minuteForm.modeOperatoire === false ||
           this.minuteForm.saitQuoiFaireUrgence === false;
  }

  minuteFormValide(): boolean {
    return !!this.minuteForm.tacheAEffectuer &&
           this.minuteForm.competencesHabilitations !== null &&
           this.minuteForm.outilsEquipements !== null &&
           this.minuteForm.environnementSecurise !== null &&
           this.minuteForm.modeOperatoire !== null &&
           this.minuteForm.saitQuoiFaireUrgence !== null &&
           !!this.minuteForm.nomSignataire;
  }

  validerMinuteSecurite() {
    if (!this.minuteFormValide()) return;
    const hasNon = this.hasNonResponse();
    const body = {
      tacheAEffectuer: this.minuteForm.tacheAEffectuer,
      competencesHabilitations: this.minuteForm.competencesHabilitations,
      outilsEquipements: this.minuteForm.outilsEquipements,
      environnementSecurise: this.minuteForm.environnementSecurise,
      modeOperatoire: this.minuteForm.modeOperatoire,
      saitQuoiFaireUrgence: this.minuteForm.saitQuoiFaireUrgence,
      risquesSpecifiques: this.minuteForm.risquesSpecifiques,
      mesurePreventionImmediate: this.minuteForm.mesurePreventionImmediate,
      nomSignataire: this.minuteForm.nomSignataire,
      technicien: { id: this.user.id },
      statut: hasNon ? 'ALERTE' : 'SOUMIS'
    };
    this.http.post('http://localhost:8080/api/minutes-securite', body).subscribe({
      next: () => {
        this.minuteDejaFaite = true;
        this.showMinuteSecurite = false;
        this._currentPage = 'interventions';
        this.resetMinuteForm();
      },
      error: () => {
        this.minuteDejaFaite = true;
        this.showMinuteSecurite = false;
        this._currentPage = 'interventions';
      }
    });
  }

  annulerMinuteSecurite() {
    this.showMinuteSecurite = false;
    this._currentPage = 'home';
  }

  resetMinuteForm() {
    this.minuteForm = {
      tacheAEffectuer: '',
      competencesHabilitations: null,
      outilsEquipements: null,
      environnementSecurise: null,
      modeOperatoire: null,
      saitQuoiFaireUrgence: null,
      risquesSpecifiques: '',
      mesurePreventionImmediate: '',
      nomSignataire: ''
    };
  }

  getPageTitle(): string {
    switch(this.currentPage) {
      case 'home':          return 'Mon Dashboard';
      case 'interventions': return 'Mes Interventions';
      case 'completees':    return 'Interventions Completees';
      case 'conges':        return 'Mes Conges';
      case 'reclamations':  return 'Remontees SSE Terrain';
      case 'semenier':      return 'Semenier';
      case 'planning':      return 'Planning';
      default: return 'Dashboard Technicien';
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}