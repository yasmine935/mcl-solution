import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:8080/api/planning';

@Component({
  selector: 'app-semenier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semenier.html',
  styleUrl: './semenier.css'
})
export class Semainier implements OnInit {

  utilisateurs: any[] = [];
  allNotes: any = {};
  congesApprouves: any[] = [];
  fichesIntervention: any[] = [];
  currentUserId: number | null = null;
  mySelectedWeek: any = null;
  joursDeSemaine: any[] = [];

  dayColors = ['#1565c0', '#1976d2', '#0288d1', '#0277bd', '#01579b'];

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.detectCurrentUser();
    this.loadUtilisateurs();
    this.loadAllNotes();
    this.loadCongesApprouves();
    this.loadFichesIntervention();
    this.mySelectedWeek = this.obtenirSemaines()[1];
    this.loadWeekFromPlanning();
  }

  detectCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user.id || 1;
  }

  loadUtilisateurs() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => { this.utilisateurs = data; localStorage.setItem('utilisateurs', JSON.stringify(data)); },
      error: () => {
        const stored = localStorage.getItem('utilisateurs');
        this.utilisateurs = stored ? JSON.parse(stored) : [];
      }
    });
  }

  loadAllNotes() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        this.allNotes = {};
        data.forEach((note: any) => {
          if (note.utilisateur && note.date) {
            const d = new Date(note.date);
            const key = `${note.utilisateur.id}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            this.allNotes[key] = note.note;
          }
        });
        localStorage.setItem('planningNotes', JSON.stringify(this.allNotes));
        this.loadWeekFromPlanning();
      },
      error: () => {
        const stored = localStorage.getItem('planningNotes');
        this.allNotes = stored ? JSON.parse(stored) : {};
        this.loadWeekFromPlanning();
      }
    });
  }

  loadCongesApprouves() {
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (data) => { this.congesApprouves = data.filter((c: any) => c.statut === 'APPROUVE' || c.statut === 'EN_ATTENTE'); },
      error: () => { this.congesApprouves = []; }
    });
  }

  loadFichesIntervention() {
    this.http.get<any[]>('http://localhost:8080/api/fiches-intervention').subscribe({
      next: (data) => {
        this.fichesIntervention = data.map(f => {
          let techIds: number[] = [];
          if (f.technicienIds) {
            techIds = f.technicienIds.split(',').map((id: string) => Number.parseInt(id.trim(), 10)).filter((n: number) => !Number.isNaN(n));
          } else if (f.technicien?.id) {
            techIds = [f.technicien.id];
          }
          return {
            id: f.id,
            numProjet: f.numProjet,
            client: f.client,
            technicienId: f.technicien?.id || null,
            technicienIds: techIds,
            dateDebut: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
            dateFin: f.dateFin ? f.dateFin.split('T')[0] : ''
          };
        });
      },
      error: () => { this.fichesIntervention = []; }
    });
  }

  loadWeekFromPlanning() {
    if (!this.mySelectedWeek) return;
    this.joursDeSemaine = [];
    const noms = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    const lundi = new Date(this.mySelectedWeek.lundi);
    for (let i = 0; i < 5; i++) {
      const date = new Date(lundi);
      date.setDate(lundi.getDate() + i);
      this.joursDeSemaine.push({
        nom: noms[i],
        date: date,
        dateAffichee: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        color: this.dayColors[i]
      });
    }
  }

  // ── Récupère la note manuelle pour un user/date ──
  getNoteForUserDate(userId: number, date: Date): string {
    const key = `${userId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  // ── Récupère le congé approuvé pour un user/date ──
  getCongeForUserOnDay(userId: number, date: Date): any {
    return this.congesApprouves.find((c: any) => {
      if (c.utilisateur?.id !== userId) return false;
      const debut = new Date(c.dateDebut); debut.setHours(0, 0, 0, 0);
      const fin = new Date(c.dateFin); fin.setHours(23, 59, 59, 999);
      const d = new Date(date); d.setHours(12, 0, 0, 0);
      return d >= debut && d <= fin;
    }) || null;
  }

  // ── Récupère la fiche d'intervention pour un user/date ──
  getFicheForUserOnDay(userId: number, date: Date): any {
    return this.fichesIntervention.find(f => {
      const assigné = f.technicienId === userId || (f.technicienIds || []).includes(userId);
      if (!assigné || !f.dateDebut) return false;
      const debut = new Date(f.dateDebut); debut.setHours(0, 0, 0, 0);
      const fin = f.dateFin ? new Date(f.dateFin) : new Date(f.dateDebut); fin.setHours(23, 59, 59, 999);
      const d = new Date(date); d.setHours(12, 0, 0, 0);
      return d >= debut && d <= fin;
    }) || null;
  }

  // ── Info cellule : congé > fiche > note ──
  getCellInfo(userId: number, date: Date): { label: string; color: string } | null {
    const note = this.getNoteForUserDate(userId, date);
    if (note) return { label: note, color: this.getCouleurNote(note) };

    const conge = this.getCongeForUserOnDay(userId, date);
    if (conge) {
      const pending = conge.statut === 'EN_ATTENTE' ? '⏳ ' : '';
      let label = `${pending}🏖️ Congé`;
      if (conge.type === 'RTT') label = `${pending}😴 RTT`;
      else if (conge.type === 'MALADIE') label = `${pending}🏥 Maladie`;
      else if (conge.type === 'FORMATION') label = `${pending}📚 Formation`;
      else if (conge.type === 'SANS_SOLDE') label = `${pending}💼 Sans solde`;
      const color = conge.statut === 'EN_ATTENTE' ? '#9e9e9e' : '#c62828';
      return { label, color };
    }

    const fiche = this.getFicheForUserOnDay(userId, date);
    if (fiche) return { label: `🔧 ${fiche.client || fiche.numProjet}`, color: '#1a6b3c' };

    return null;
  }

  getNotePlanningForJour(date: Date): string {
    if (!date || !this.currentUserId) return '';
    return this.getNoteForUserDate(this.currentUserId, date);
  }

  getCellInfoForJour(date: Date): { label: string; color: string } | null {
    if (!this.currentUserId) return null;
    return this.getCellInfo(this.currentUserId, date);
  }

  getCouleurNote(note: string): string {
    if (!note) return '#f5f5f5';
    const n = note.toUpperCase();
    if (n.includes('BUREAU')) return '#1565c0';
    if (n.includes('DISTANCE') || n.includes('TELETRAVAIL')) return '#e65100';
    if (n.includes('DEPLACEMENT') || n.includes('CLIENT')) return '#6a1b9a';
    if (n.includes('CONGE') || n.includes('RTT') || n.includes('ABSENT')) return '#c62828';
    if (n.includes('FORMATION')) return '#2e7d32';
    if (n.includes('🔧') || n.includes('INTERVENTION')) return '#1a6b3c';
    return '#37474f';
  }

  getNoteEmoji(note: string): string {
    if (!note) return '';
    const n = note.toUpperCase();
    if (n.includes('BUREAU')) return '🏢';
    if (n.includes('DISTANCE') || n.includes('TELETRAVAIL')) return '💻';
    if (n.includes('DEPLACEMENT') || n.includes('CLIENT')) return '🚗';
    if (n.includes('CONGE')) return '🏖️';
    if (n.includes('RTT')) return '😴';
    if (n.includes('ABSENT')) return '❌';
    if (n.includes('FORMATION')) return '📚';
    if (n.includes('🔧')) return '🔧';
    return '📌';
  }

  getDayHeaderColor(date: Date): string {
    const info = this.getCellInfoForJour(date);
    return info ? info.color : '#1565c0';
  }

  getCurrentUserName(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  }

  obtenirSemaines() {
    const semaines = [];
    const aujourd = new Date();
    const lundi = new Date(aujourd);
    const day = lundi.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    lundi.setDate(lundi.getDate() + diff);

    for (let i = -2; i < 10; i++) {
      const debut = new Date(lundi);
      debut.setDate(lundi.getDate() + i * 7);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + 6);
      semaines.push({
        lundi: new Date(debut),
        label: `Sem. du ${debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au ${fin.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      });
    }
    return semaines;
  }
}
