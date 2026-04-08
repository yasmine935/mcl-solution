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
export class Semenier implements OnInit {

  utilisateurs: any[] = [];
  allNotes: any = {};
  currentUserId: number | null = null;
  mySelectedWeek: any = null;
  joursDeSemaine: any[] = [];

  // Couleurs des jours de la semaine
  dayColors = ['#1565c0', '#1976d2', '#0288d1', '#0277bd', '#01579b'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.detectCurrentUser();
    this.loadUtilisateurs();
    this.loadAllNotes();
    this.mySelectedWeek = this.obtenirSemaines()[1]; // Semaine courante
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

  getNotePlanningForJour(date: Date): string {
    if (!date || !this.currentUserId) return '';
    const key = `${this.currentUserId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  getNoteForUser(userId: number, date: Date): string {
    if (!date) return '';
    const key = `${userId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  // ✅ Couleur selon la note
  getCouleurNote(note: string): string {
    if (!note) return '#f5f5f5';
    const n = note.toUpperCase();
    if (n.includes('BUREAU')) return '#1565c0';
    if (n.includes('DISTANCE') || n.includes('TELETRAVAIL')) return '#e65100';
    if (n.includes('DEPLACEMENT') || n.includes('CLIENT')) return '#6a1b9a';
    if (n.includes('CONGE') || n.includes('RTT') || n.includes('ABSENT')) return '#c62828';
    if (n.includes('FORMATION')) return '#2e7d32';
    return '#37474f';
  }

  // ✅ Emoji selon la note
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
    return '📌';
  }

  // ✅ Couleur de l'entête du jour selon la note
  getDayHeaderColor(date: Date): string {
    const note = this.getNotePlanningForJour(date);
    if (note) return this.getCouleurNote(note);
    return '#1565c0';
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