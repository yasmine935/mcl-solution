import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:8080/api/planning';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning.html',
  styleUrl: './planning.css'
})
export class Planning implements OnInit {

  utilisateurs: any[] = [];
  allNotes: any = {};
  congesApprouves: any[] = [];
  currentUserId: number | null = null;
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  joursAbbr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  joursAffiche: any[] = [];
  showModal = false;
  selectedJour: any = null;

  // ✅ Manager assignment
  isManager = false;
  showManagerModal = false;
  managerCell: { user: any; jour: any } | null = null;
  managerType = '';
  managerLieu = '';
  readonly typeOptions = ['Bureau', 'Distance', 'Déplacement', 'Formation', 'RTT', 'Absent'];

  // ✅ Grille semaine manager
  currentWeekStart: Date = new Date();
  weekDays: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.detectCurrentUser();
    this.currentWeekStart = this.getMondayOf(new Date());
    this.generateSemaine();
    this.loadUtilisateurs();
    this.loadAllNotes();
    this.loadCongesApprouves();
    this.generateCalendrier();
  }

  detectCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user.id || 1;
    const role = (user.role || '').toUpperCase();
    this.isManager = role !== 'TECHNICIEN';
  }

  loadUtilisateurs() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => {
        this.utilisateurs = data;
        localStorage.setItem('utilisateurs', JSON.stringify(data));
      },
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
        this.generateCalendrier();
      },
      error: () => {
        const stored = localStorage.getItem('planningNotes');
        this.allNotes = stored ? JSON.parse(stored) : {};
        this.generateCalendrier();
      }
    });
  }

  // ✅ CHARGER LES CONGES APPROUVES
  loadCongesApprouves() {
    this.http.get<any[]>('http://localhost:8080/api/conges').subscribe({
      next: (data) => {
        this.congesApprouves = data.filter((c: any) => c.statut === 'APPROUVE');
        this.generateCalendrier();
      },
      error: () => {
        this.congesApprouves = [];
      }
    });
  }

  // ✅ Vérifie si un jour donné est en congé approuvé pour un user
  getCongeForUserOnDay(userId: number, date: Date): any | null {
    return this.congesApprouves.find((c: any) => {
      if (c.utilisateur?.id !== userId) return false;
      const debut = new Date(c.dateDebut);
      const fin = new Date(c.dateFin);
      debut.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      return date >= debut && date <= fin;
    }) || null;
  }

  // ✅ Libellé du congé selon le type
  getCongeLabel(conge: any): string {
    const map: any = {
      'ANNUEL': '🌴 Congé',
      'RTT': '😴 RTT',
      'MALADIE': '🏥 Maladie',
      'FORMATION': '📚 Formation',
      'SANS_SOLDE': '💼 Sans solde',
      'AUTRE': '📋 Congé'
    };
    return map[conge.type] || '🏖️ Congé';
  }

  // ✅ Couleur du congé selon le type
  getCongeColor(conge: any): string {
    const map: any = {
      'ANNUEL': '#1565c0',
      'RTT': '#0277bd',
      'MALADIE': '#c62828',
      'FORMATION': '#2e7d32',
      'SANS_SOLDE': '#546e7a',
      'AUTRE': '#6a1b9a'
    };
    return map[conge.type] || '#c62828';
  }

  generateCalendrier() {
    this.joursAffiche = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    let dayOfWeek = firstDay.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    startDate.setDate(startDate.getDate() - dayOfWeek + 1);
    let currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getDay() !== 1) {
      const jour = currentDate.getDate();
      const mois = currentDate.getMonth();
      const annee = currentDate.getFullYear();
      const key = `${this.currentUserId}_${annee}-${mois + 1}-${jour}`;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dateObj = new Date(annee, mois, jour);

      // ✅ Vérifier si l'utilisateur courant a un congé ce jour
      const conge = this.getCongeForUserOnDay(this.currentUserId!, dateObj);

      this.joursAffiche.push({
        jour: mois === this.currentMonth ? jour : 0,
        affichage: jour,
        date: dateObj,
        note: this.allNotes[key] || '',
        key: key,
        isWeekend,
        isToday: this.isToday(dateObj),
        conge: conge
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.generateCalendrier();
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.generateCalendrier();
  }

  ouvrirJour(jour: any) {
    if (jour.jour !== 0 && this.isManager) { this.selectedJour = { ...jour }; this.showModal = true; }
  }

  closeModal() { this.showModal = false; this.selectedJour = null; }

  sauvegarderNote() {
    if (!this.selectedJour) return;
    const d = this.selectedJour.date as Date;
    const body = {
      note: this.selectedJour.note,
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      utilisateur: { id: this.currentUserId }
    };
    this.http.post<any>(`${API}/sauvegarder`, body).subscribe({
      next: () => {
        this.allNotes[this.selectedJour.key] = this.selectedJour.note;
        localStorage.setItem('planningNotes', JSON.stringify(this.allNotes));
        this.generateCalendrier();
        this.closeModal();
      },
      error: () => {
        this.allNotes[this.selectedJour.key] = this.selectedJour.note;
        localStorage.setItem('planningNotes', JSON.stringify(this.allNotes));
        this.generateCalendrier();
        this.closeModal();
      }
    });
  }

  getNotesForUser(userId: number, jour: number): string {
    const key = `${userId}_${this.currentYear}-${this.currentMonth + 1}-${jour}`;
    return this.allNotes[key] || '';
  }

  // ✅ Note ou congé pour affichage dans le tableau équipe
  getInfoForUserOnDay(userId: number, jourObj: any): { label: string, color: string, isConge: boolean } | null {
    const note = this.getNotesForUser(userId, jourObj.jour);
    if (note) return { label: note, color: this.getNoteColor(note), isConge: false };

    const conge = this.getCongeForUserOnDay(userId, jourObj.date);
    if (conge) return { label: this.getCongeLabel(conge), color: this.getCongeColor(conge), isConge: true };

    return null;
  }

  getNoteColor(note: string): string {
    if (!note) return '';
    const n = note.toUpperCase();
    if (n.includes('BUREAU')) return '#1565c0';
    if (n.includes('DISTANCE') || n.includes('TELETRAVAIL')) return '#e65100';
    if (n.includes('DEPLACEMENT') || n.includes('CLIENT')) return '#6a1b9a';
    if (n.includes('CONGE') || n.includes('RTT') || n.includes('ABSENT')) return '#c62828';
    if (n.includes('FORMATION')) return '#2e7d32';
    return '#37474f';
  }

  getMoisAnnee(): string {
    return `${this.moisNoms[this.currentMonth]} ${this.currentYear}`;
  }

  getCurrentUserName(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  }

  get joursAvecJour() {
    return this.joursAffiche.filter(j => j.jour !== 0);
  }

  get techniciens(): any[] {
    return this.utilisateurs.filter(u => (u.role || '').toUpperCase() === 'TECHNICIEN');
  }

  // ✅ Ouvre le modal d'assignation pour un technicien × jour
  ouvrirCelluleEquipe(user: any, jour: any) {
    if (!this.isManager || jour.jour === 0 || this.getCongeForUserOnDay(user.id, jour.date)) return;
    const existing = this.getInfoForUserOnDay(user.id, jour);
    const existingLabel = existing ? existing.label : '';
    // Extraire le type et le lieu si note composée "Type - Lieu"
    const parts = existingLabel.split(' - ');
    this.managerType = parts[0] || '';
    this.managerLieu = parts.slice(1).join(' - ') || '';
    this.managerCell = { user, jour };
    this.showManagerModal = true;
  }

  fermerManagerModal() {
    this.showManagerModal = false;
    this.managerCell = null;
    this.managerType = '';
    this.managerLieu = '';
  }

  sauvegarderAssignation() {
    if (!this.managerCell || !this.managerType) return;
    const { user, jour } = this.managerCell;
    const d = jour.date as Date;
    const note = this.managerLieu.trim()
      ? `${this.managerType} - ${this.managerLieu.trim()}`
      : this.managerType;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const body = { note, date: dateStr, utilisateur: { id: user.id } };
    const key = `${user.id}_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    this.http.post<any>(`${API}/sauvegarder`, body).subscribe({
      next: () => { this.allNotes[key] = note; this.applyAndClose(); },
      error: () => { this.allNotes[key] = note; this.applyAndClose(); }
    });
  }

  private applyAndClose() {
    this.allNotes = { ...this.allNotes };
    localStorage.setItem('planningNotes', JSON.stringify(this.allNotes));
    this.generateCalendrier();
    this.fermerManagerModal();
  }

  // ===== GRILLE SEMAINE =====

  getMondayOf(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  generateSemaine() {
    this.weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      this.weekDays.push({
        date: d, jour: d.getDate(),
        abbr: this.joursAbbr[i],
        isToday: this.isToday(d)
      });
    }
  }

  prevWeek() { const d = new Date(this.currentWeekStart); d.setDate(d.getDate() - 7); this.currentWeekStart = d; this.generateSemaine(); }
  nextWeek() { const d = new Date(this.currentWeekStart); d.setDate(d.getDate() + 7); this.currentWeekStart = d; this.generateSemaine(); }
  goToCurrentWeek() { this.currentWeekStart = this.getMondayOf(new Date()); this.generateSemaine(); }

  getWeekLabel(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 4);
    const s = this.currentWeekStart;
    if (s.getMonth() === end.getMonth()) {
      return `${s.getDate()} – ${end.getDate()} ${this.moisNoms[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${this.moisNoms[s.getMonth()]} – ${end.getDate()} ${this.moisNoms[end.getMonth()]} ${s.getFullYear()}`;
  }

  getNoteForDay(userId: number, date: Date): string {
    const key = `${userId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  getCellInfo(userId: number, date: Date): { label: string; color: string } | null {
    const conge = this.getCongeForUserOnDay(userId, date);
    if (conge) return { label: this.getCongeLabel(conge), color: this.getCongeColor(conge) };
    const note = this.getNoteForDay(userId, date);
    if (note) return { label: note, color: this.getNoteColor(note) };
    return null;
  }

  ouvrirCelluleSemaine(user: any, weekDay: any) {
    if (!this.isManager || this.getCongeForUserOnDay(user.id, weekDay.date)) return;
    const note = this.getNoteForDay(user.id, weekDay.date);
    const parts = note.split(' - ');
    this.managerType = parts[0] || 'Bureau';
    this.managerLieu = parts.slice(1).join(' - ') || '';
    this.managerCell = { user, jour: { date: weekDay.date, jour: weekDay.jour, affichage: weekDay.jour } };
    this.showManagerModal = true;
  }

  getJourLabel(jour: any): string {
    if (!jour) return '';
    const d = jour.date as Date;
    const j = this.joursAbbr[(d.getDay() + 6) % 7];
    return `${j} ${d.getDate()} ${this.moisNoms[d.getMonth()]}`;
  }
}