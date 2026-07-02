import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API = 'http://localhost:8080/api/journal';

@Component({
  selector: 'app-journal-travail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './journal-travail.html',
  styleUrl: './journal-travail.css'
})
export class JournalTravail implements OnInit {
  user: any = {};
  journaux: any[] = [];
  vue: 'liste' | 'formulaire' | 'detail' = 'liste';
  journalSelectionne: any = null;

  form = {
    dateJournee: new Date().toISOString().split('T')[0],
    notesOriginales: '',
    rapportGenere: ''
  };

  generationEnCours = false;
  sauvegardeEnCours = false;
  erreurIA: string | null = null;

  // ── Dictée vocale ──
  recognition: any = null;
  isListening = false;
  private noteBase = ''; // texte déjà validé avant la dernière dictée

  get isManager(): boolean {
    const role = this.user?.role;
    return role === 'TECHNICIEN_SUP' || role === 'FERID' || role === 'KARINE' || role === 'ESSAN' || role === 'AURELIEN' || role === 'ODILE';
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.chargerJournaux();
  }

  chargerJournaux() {
    const url = this.isManager ? API : `${API}/employe/${this.user.id}`;
    this.http.get<any[]>(url).subscribe({
      next: data => this.journaux = data,
      error: () => this.journaux = []
    });
  }

  ouvrirFormulaire() {
    this.form = {
      dateJournee: new Date().toISOString().split('T')[0],
      notesOriginales: '',
      rapportGenere: ''
    };
    this.erreurIA = null;
    this.noteBase = '';
    this.arreterDictee();
    this.vue = 'formulaire';
  }

  annuler() {
    this.arreterDictee();
    this.vue = 'liste';
    this.erreurIA = null;
  }

  toggleDictee() {
    if (this.isListening) {
      this.arreterDictee();
      return;
    }

    const SR = (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    if (!SR) {
      alert('La dictée vocale n\'est pas supportée par votre navigateur.\nUtilisez Chrome ou Edge.');
      return;
    }

    this.noteBase = this.form.notesOriginales;
    this.recognition = new SR();
    this.recognition.lang = 'fr-FR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) this.noteBase += final;
      this.form.notesOriginales = this.noteBase + interim;
    };

    this.recognition.onerror = () => { this.isListening = false; };
    this.recognition.onend = () => { this.isListening = false; };

    this.recognition.start();
    this.isListening = true;
  }

  arreterDictee() {
    this.recognition?.stop();
    this.isListening = false;
  }

  genererRapportIA() {
    if (!this.form.notesOriginales.trim()) {
      this.erreurIA = 'Décrivez votre journée avant de générer le rapport.';
      return;
    }
    this.generationEnCours = true;
    this.erreurIA = null;
    this.http.post<any>(`${API}/generer`, { notes: this.form.notesOriginales }).subscribe({
      next: data => {
        this.form.rapportGenere = data.rapport || '';
        this.generationEnCours = false;
      },
      error: err => {
        this.erreurIA = err?.error?.erreur || 'Erreur lors de la génération. Vérifiez la clé API.';
        this.generationEnCours = false;
      }
    });
  }

  sauvegarder() {
    if (!this.form.rapportGenere.trim()) {
      alert('Générez d\'abord le rapport avant de sauvegarder.');
      return;
    }
    this.sauvegardeEnCours = true;
    const payload = {
      userId: this.user.id,
      dateJournee: this.form.dateJournee,
      notesOriginales: this.form.notesOriginales,
      rapportGenere: this.form.rapportGenere
    };
    this.http.post<any>(API, payload).subscribe({
      next: () => {
        this.chargerJournaux();
        this.vue = 'liste';
        this.sauvegardeEnCours = false;
      },
      error: () => { alert('Erreur lors de la sauvegarde.'); this.sauvegardeEnCours = false; }
    });
  }

  voirDetail(j: any) {
    this.journalSelectionne = j;
    this.vue = 'detail';
  }

  supprimer(id: number) {
    if (!confirm('Supprimer ce rapport de journée ?')) return;
    this.http.delete(`${API}/${id}`).subscribe({
      next: () => this.chargerJournaux(),
      error: () => alert('Erreur lors de la suppression.')
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  apercu(texte: string, n = 120): string {
    if (!texte) return '—';
    return texte.length > n ? texte.substring(0, n) + '...' : texte;
  }
}
