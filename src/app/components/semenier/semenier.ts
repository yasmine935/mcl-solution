import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-semenier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="currentUserId" style="padding: 20px; background: white; border-radius: 8px; min-height: 100vh;">

      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #1565C0; padding-bottom: 15px;">
        <h3 style="color: #1565C0; margin: 0;">📅 Semenier — {{ getCurrentUserName() }}</h3>
        <span style="font-size: 12px; color: #666; background: #e3f2fd; padding: 4px 12px; border-radius: 20px;">
          Les données viennent automatiquement du Planning ✅
        </span>
      </div>

      <!-- SÉLECTION DE LA SEMAINE -->
      <div style="background: #E3F2FD; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 2px solid #1565C0;">
        <h4 style="color: #1565C0; margin: 0 0 12px 0;">✏️ MA SEMAINE</h4>
        <label style="font-weight: 600;">Sélectionne ta semaine:</label><br/>
        <select [(ngModel)]="mySelectedWeek" (change)="loadWeekFromPlanning()" style="padding: 10px; margin-top: 8px; width: 100%; box-sizing: border-box; border: 1px solid #90caf9; border-radius: 6px; font-size: 14px;">
          <option *ngFor="let semaine of obtenirSemaines()" [ngValue]="semaine">
            {{ semaine.label }}
          </option>
        </select>
      </div>

      <!-- MA SEMAINE — VUE AUTO DU PLANNING -->
      <div *ngIf="mySelectedWeek" style="background: #f8faff; padding: 20px; border-radius: 8px; margin-bottom: 28px; border: 1px solid #c5cae9;">
        <h4 style="color: #1565C0; margin: 0 0 16px 0;">
          📊 Ma semaine : {{ mySelectedWeek.label }}
        </h4>

        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
          <div *ngFor="let jour of joursDeSemaine" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
            
            <!-- En-tête jour -->
            <div style="background: #1565C0; color: white; padding: 10px; text-align: center;">
              <strong style="font-size: 13px;">{{ jour.nom }}</strong><br/>
              <span style="font-size: 11px; opacity: 0.85;">{{ jour.dateAffichee }}</span>
            </div>

            <!-- Contenu du jour depuis Planning -->
            <div style="padding: 12px; min-height: 80px; text-align: center;">
              <div *ngIf="getNotePlanningForJour(jour.date)"
                [style.backgroundColor]="getCouleurNote(getNotePlanningForJour(jour.date))"
                style="padding: 8px; border-radius: 6px; color: white; font-weight: 600; font-size: 12px; margin-bottom: 6px;">
                {{ getNotePlanningForJour(jour.date) }}
              </div>
              <div *ngIf="!getNotePlanningForJour(jour.date)"
                style="padding: 8px; background: #f5f5f5; border-radius: 6px; color: #bbb; font-size: 12px;">
                Non rempli
                <br/>
                <small style="font-size: 10px; color: #ccc;">Ajoutez une note dans le Planning</small>
              </div>
            </div>
          </div>
        </div>

        <!-- INFO BOX -->
        <div style="margin-top: 16px; padding: 12px 16px; background: #e8f5e9; border-radius: 6px; border-left: 4px solid #4CAF50; font-size: 13px; color: #388e3c;">
          💡 Pour modifier votre planning, allez dans la section <strong>Planning</strong> et ajoutez vos notes jour par jour.
        </div>
      </div>

      <!-- VUE GLOBALE TOUTE L'ÉQUIPE -->
      <div *ngIf="mySelectedWeek">
        <h4 style="color: #1565C0; margin: 0 0 16px 0;">
          📊 TOUTE L'ÉQUIPE — {{ mySelectedWeek.label }}
        </h4>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #1565C0; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #90caf9; min-width: 140px;">PERSONNE</th>
                <th *ngFor="let jour of joursDeSemaine" style="padding: 12px; text-align: center; border: 1px solid #90caf9;">
                  {{ jour.nom }}<br/>
                  <small style="opacity: 0.75; font-size: 10px;">{{ jour.dateAffichee }}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of utilisateurs" style="border: 1px solid #e0e0e0;">
                <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #333;">
                  {{ user.prenom }} {{ user.nom }}
                </td>
                <td *ngFor="let jour of joursDeSemaine" style="padding: 8px; text-align: center; border: 1px solid #e0e0e0;">
                  <div
                    [style.backgroundColor]="getCouleurNote(getNoteForUser(user.id, jour.date))"
                    [style.color]="getNoteForUser(user.id, jour.date) ? 'white' : '#bbb'"
                    style="padding: 8px; border-radius: 6px; font-weight: 500; font-size: 12px;">
                    {{ getNoteForUser(user.id, jour.date) || 'Non rempli' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div *ngIf="!currentUserId" style="padding: 40px; text-align: center; color: #999;">
      <p>Veuillez vous connecter d'abord</p>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class Semenier implements OnInit {

  utilisateurs: any[] = [];
  allNotes: any = {};
  currentUserId: number | null = null;
  mySelectedWeek: any = null;
  joursDeSemaine: any[] = [];

  ngOnInit() {
    this.detectCurrentUser();
    this.loadUtilisateurs();
    this.loadAllNotes();
    this.mySelectedWeek = this.obtenirSemaines()[0];
    this.loadWeekFromPlanning();
  }

  detectCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id || 1;
    } else {
      this.currentUserId = 1;
    }
  }

  loadUtilisateurs() {
    const stored = localStorage.getItem('utilisateurs');
    this.utilisateurs = stored ? JSON.parse(stored) : [
      { id: 1, prenom: 'Ferid', nom: 'Admin', role: 'ADMIN' },
      { id: 2, prenom: 'Tech', nom: 'One', role: 'TECHNICIEN' },
      { id: 3, prenom: 'KIA', nom: 'Manager', role: 'TECHNICIEN_SUP' },
      { id: 4, prenom: 'Aurelien', nom: 'Manager', role: 'MANAGER' },
      { id: 5, prenom: 'Odile', nom: 'Manager', role: 'MANAGER' }
    ];
  }

  loadAllNotes() {
    const stored = localStorage.getItem('planningNotes');
    this.allNotes = stored ? JSON.parse(stored) : {};
  }

  // ✅ Génère les 5 jours de la semaine sélectionnée
  loadWeekFromPlanning() {
    if (!this.mySelectedWeek) return;
    this.loadAllNotes(); // Refresh depuis localStorage
    this.joursDeSemaine = [];
    const noms = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    const lundi = new Date(this.mySelectedWeek.lundi);

    for (let i = 0; i < 5; i++) {
      const date = new Date(lundi);
      date.setDate(lundi.getDate() + i);
      this.joursDeSemaine.push({
        nom: noms[i],
        date: date,
        dateAffichee: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      });
    }
  }

  // ✅ Lit la note du Planning pour l'utilisateur connecté
  getNotePlanningForJour(date: Date): string {
    if (!date || !this.currentUserId) return '';
    const key = `${this.currentUserId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  // ✅ Lit la note du Planning pour n'importe quel utilisateur (vue équipe)
  getNoteForUser(userId: number, date: Date): string {
    if (!date) return '';
    const key = `${userId}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return this.allNotes[key] || '';
  }

  // ✅ Couleur selon le contenu de la note
  getCouleurNote(note: string): string {
    if (!note) return '#f5f5f5';
    const n = note.toUpperCase();
    if (n.includes('BUREAU'))      return '#1976D2';
    if (n.includes('DISTANCE') || n.includes('TELETRAVAIL')) return '#FF9800';
    if (n.includes('DEPLACEMENT') || n.includes('CLIENT'))   return '#9C27B0';
    if (n.includes('CONGE') || n.includes('RTT') || n.includes('ABSENT')) return '#F44336';
    if (n.includes('FORMATION'))   return '#00897B';
    if (n.includes('SORTIE'))      return '#E64A19';
    return '#1565C0'; // couleur par défaut pour toute autre note
  }

  getCurrentUserName(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  }

  getCurrentUserRole(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? user.role : '';
  }

  // ✅ Génère les 6 prochaines semaines
  obtenirSemaines() {
    const semaines = [];
    const aujourd = new Date();
    const lundi = new Date(aujourd);
    // Aller au lundi de la semaine courante
    const day = lundi.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    lundi.setDate(lundi.getDate() + diff);

    for (let i = -1; i < 8; i++) {
      const debutSemaine = new Date(lundi);
      debutSemaine.setDate(lundi.getDate() + i * 7);
      const finSemaine = new Date(debutSemaine);
      finSemaine.setDate(debutSemaine.getDate() + 6);

      semaines.push({
        lundi: new Date(debutSemaine),
        label: `Semaine du ${debutSemaine.toLocaleDateString('fr-FR')} au ${finSemaine.toLocaleDateString('fr-FR')}`
      });
    }
    return semaines;
  }
}