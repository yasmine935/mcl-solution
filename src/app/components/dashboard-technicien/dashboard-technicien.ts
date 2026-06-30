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
import { Semainier } from '../semenier/semenier';
import { Planning } from '../planning/planning';
import { RemonteesTerrainComponent } from '../remontees-terrain/remontees-terrain';

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule,
    Semainier, Planning, RemonteesTerrainComponent
  ],
  templateUrl: './dashboard-technicien.html',
  styleUrl: './dashboard-technicien.css'
})
export class DashboardTechnicien implements OnInit {
  user: any = {};
  sidebarOpen = false;

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
  ficheDetail: any = null;
  selectedConge: any = null;

  pourcentageSoldeRestant(restant: number, total: number): number {
    if (!total) return 0;
    return Math.max(0, Math.min(100, (restant / total) * 100));
  }

  showCongeDetail = false;

  voirDetailFiche(fiche: any) { this.ficheDetail = fiche; }
  ouvrirDetailConge(c: any) { this.selectedConge = c; this.showCongeDetail = true; }
  fermerDetailConge() { this.showCongeDetail = false; this.selectedConge = null; }

  conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
  nombreJours = 0;
  congeEnEditionId: number | null = null;

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
    // Vérifie si la minute sécurité a déjà été faite aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const key = `minute_securite_${this.user.id}_${today}`;
    this.minuteDejaFaite = localStorage.getItem(key) === 'done';
    this.loadData();
  }

  loadData() {
    this.loadInterventions();
    this.loadConges();
    this.loadSoldeConges();
  }

  loadInterventions() {
    this.http.get<any[]>(`http://localhost:8080/api/fiches-intervention/technicien/${this.user.id}`).subscribe({
      next: (data) => {
        localStorage.setItem('fiches_intervention', JSON.stringify(data));
        const mesFiches = data.map((f: any) => ({
          ...f,
          numProjet: f.numProjet || f.numeroProjet,
          dateDebut: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
          dateFin: f.dateFin ? f.dateFin.split('T')[0] : '',
          taches: f.taches ? JSON.parse(f.taches) : []
        }));
        this.interventions = mesFiches.filter((f: any) => f.statut !== 'COMPLETEE' && f.statut !== 'VALIDEE');
        this.interventionsCompletees = mesFiches.filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE');
      },
      error: () => console.error('Erreur chargement interventions')
    });
  }

  marquerTerminee(id: number) {
    this.http.put<any>(`http://localhost:8080/api/fiches-intervention/${id}/statut`, null, {
      params: { statut: 'COMPLETEE' }
    }).subscribe({
      next: () => {
        const fiche = this.interventions.find((f: any) => f.id === id);
        if (fiche) { fiche.statut = 'COMPLETEE'; this.interventionsCompletees.push(fiche); }
        this.interventions = this.interventions.filter((f: any) => f.id !== id);
      },
      error: () => {
        const fiche = this.interventions.find((f: any) => f.id === id);
        if (fiche) { fiche.statut = 'COMPLETEE'; this.interventionsCompletees.push(fiche); }
        this.interventions = this.interventions.filter((f: any) => f.id !== id);
      }
    });
  }

  getDuree(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const d1 = new Date(dateDebut); const d2 = new Date(dateFin);
    if (d2 < d1) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  formatDateFr(d: string): string {
    if (!d) return '—';
    const [y, m, j] = d.split('-');
    return `${j}/${m}/${y}`;
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

  showSoldeEpuiseWarning = false;

  deposerConge() {
    if (this.conge.type === 'ANNUEL' && this.soldeConges && this.soldeConges.soldeAnnuelRestant <= 0) {
      this.showSoldeEpuiseWarning = true;
      return;
    }
    this.envoyerConge();
  }

  confirmerEnvoiMalgreSolde() {
    this.showSoldeEpuiseWarning = false;
    this.envoyerConge();
  }

  private envoyerConge() {
    if (this.congeEnEditionId) {
      this.http.put(`http://localhost:8080/api/conges/${this.congeEnEditionId}`, this.conge).subscribe(() => {
        this.loadConges();
        this.loadSoldeConges();
        this.showCongeForm = false;
        this.resetCongeForm();
      }, error => console.error('Erreur modification conge', error));
      return;
    }
    const demande = { ...this.conge, utilisateur: { id: this.user.id }, manager: { id: 3 } };
    this.http.post('http://localhost:8080/api/conges', demande).subscribe(() => {
      this.loadConges();
      this.loadSoldeConges();
      this.showCongeForm = false;
      this.resetCongeForm();
    }, error => console.error('Erreur envoi conge', error));
  }

  modifierMonConge(c: any) {
    this.congeEnEditionId = c.id;
    this.conge = { dateDebut: c.dateDebut, dateFin: c.dateFin, type: c.type, motif: c.motif || '', description: c.description || '', periode: c.periode || '' };
    this.calculerNombreJours();
    this.showCongeForm = true;
    this.showCongeDetail = false;
  }

  supprimerMonConge(id: number) {
    if (!confirm('Supprimer cette demande de congé ?')) return;
    this.http.delete(`http://localhost:8080/api/conges/${id}`).subscribe({
      next: () => {
        this.loadConges();
        this.loadSoldeConges();
        this.showCongeDetail = false;
        this.selectedConge = null;
      },
      error: () => alert('Erreur lors de la suppression')
    });
  }

  calculerNombreJours() {
    if (this.conge.dateDebut !== this.conge.dateFin) this.conge.periode = '';
    if (this.conge.dateDebut && this.conge.dateFin) {
      this.nombreJours = this.calculerJours(this.conge.dateDebut, this.conge.dateFin, this.conge.periode);
    } else {
      this.nombreJours = 0;
    }
  }

  onToggleDemiJournee(checked: boolean) {
    this.conge.periode = checked ? 'MATIN' : '';
    this.calculerNombreJours();
  }

  calculerJours(dateDebut: string, dateFin: string, periode?: string): number {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return 0;
    if (dateDebut === dateFin && (periode === 'MATIN' || periode === 'APRES_MIDI')) return 0.5;
    let jours = 0;
    const courant = new Date(debut);
    while (courant <= fin) {
      const jourSemaine = courant.getDay();
      if (jourSemaine !== 0 && jourSemaine !== 6) jours++;
      courant.setDate(courant.getDate() + 1);
    }
    return jours;
  }

  resetCongeForm() {
    this.conge = { dateDebut: '', dateFin: '', type: '', motif: '', description: '', periode: '' };
    this.nombreJours = 0;
    this.congeEnEditionId = null;
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
    const today = new Date().toISOString().split('T')[0];
    const key = `minute_securite_${this.user.id}_${today}`;
    this.http.post('http://localhost:8080/api/minutes-securite', body).subscribe({
      next: () => {
        localStorage.setItem(key, 'done');
        this.minuteDejaFaite = true;
        this.showMinuteSecurite = false;
        this._currentPage = 'interventions';
        this.resetMinuteForm();
      },
      error: () => {
        localStorage.setItem(key, 'done');
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
      case 'Semainier':      return 'Semainier';
      case 'planning':      return 'Planning';
      default: return 'Dashboard Technicien';
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}


