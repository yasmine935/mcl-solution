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
        <h3 style="color: #1565C0; margin: 0;">📅 {{ getCurrentUserName() }}</h3>
        <span style="font-size: 12px; color: #666;">{{ getCurrentUserRole() }}</span>
      </div>

      <!-- MA SEMAINE - FORMULAIRE PERSO -->
      <div style="background: #E3F2FD; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 2px solid #1565C0;">
        <h4 style="color: #1565C0; margin: 0 0 15px 0;">✏️ MA SEMAINE</h4>
        
        <div style="margin-bottom: 15px;">
          <label style="font-weight: 600;">Sélectionne ta semaine:</label><br/>
          <select [(ngModel)]="mySelectedWeek" (change)="loadMyWeek()" style="padding: 10px; margin-top: 5px; width: 100%; box-sizing: border-box;">
            <option *ngFor="let semaine of obtenirSemaines()" [value]="semaine">
              {{ semaine.semaine }}
            </option>
          </select>
        </div>

        <!-- JOURS DE LA SEMAINE - FORMULAIRE PERSO -->
        <div *ngIf="mySelectedWeek" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div *ngFor="let jour of joursSemaine" style="border: 1px solid #ccc; border-radius: 6px; padding: 12px; background: white;">
            <strong style="color: #1565C0; font-size: 14px;">{{ jour }}</strong><br/><br/>
            
            <div style="margin-bottom: 10px;">
              <input type="checkbox" [(ngModel)]="myWeek[jour].journeeComplete" (change)="toggleJourneeComplete(jour)">
              <label style="margin-left: 5px; font-size: 13px;">Journée complète</label>
            </div>

            <!-- JOURNEE COMPLETE -->
            <div *ngIf="myWeek[jour].journeeComplete">
              <select [(ngModel)]="myWeek[jour].localisation" style="width: 100%; padding: 6px; font-size: 12px;">
                <option value="BUREAU">🏢 BUREAU</option>
                <option value="DISTANCE">💻 DISTANCE</option>
                <option value="DEPLACEMENT">🚗 DEPLACEMENT</option>
                <option value="CONGE">🏖️ CONGE</option>
              </select>
            </div>

            <!-- MATIN + APRES-MIDI -->
            <div *ngIf="!myWeek[jour].journeeComplete">
              <div style="margin-bottom: 8px;">
                <label style="font-size: 11px; color: #666;">Matin:</label>
                <select [(ngModel)]="myWeek[jour].matin" style="width: 100%; padding: 6px; font-size: 11px;">
                  <option value="BUREAU">🏢 BUREAU</option>
                  <option value="DISTANCE">💻 DISTANCE</option>
                  <option value="DEPLACEMENT">🚗 DEPLACEMENT</option>
                  <option value="CONGE">🏖️ CONGE</option>
                </select>
              </div>

              <div style="margin-bottom: 8px;">
                <label style="font-size: 11px; color: #666;">Après-midi:</label>
                <select [(ngModel)]="myWeek[jour].apresMidi" style="width: 100%; padding: 6px; font-size: 11px;">
                  <option value="BUREAU">🏢 BUREAU</option>
                  <option value="DISTANCE">💻 DISTANCE</option>
                  <option value="DEPLACEMENT">🚗 DEPLACEMENT</option>
                  <option value="SORTIE">🚗 SORTIE à</option>
                  <option value="CONGE">🏖️ CONGE</option>
                </select>
              </div>

              <!-- SI SORTIE: HEURE -->
              <div *ngIf="myWeek[jour].apresMidi === 'SORTIE'">
                <label style="font-size: 11px; color: #666;">Quelle heure?</label>
                <input type="time" [(ngModel)]="myWeek[jour].heureSortie" style="width: 100%; padding: 6px; font-size: 11px;">
              </div>
            </div>
          </div>
        </div>

        <!-- BOUTON VALIDER -->
        <button (click)="validerMaSemaine()" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 14px;">
          ✓ VALIDER MA SEMAINE
        </button>
      </div>

      <!-- VUE GLOBALE - TOUT LE MONDE -->
      <div *ngIf="mySelectedWeek">
        <h4 style="color: #1565C0; margin: 0 0 20px 0;">📊 TOUTE L'ÉQUIPE - {{ mySelectedWeek.semaine }}</h4>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #1565C0; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ccc;">PERSONNE</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ccc;">LUNDI</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ccc;">MARDI</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ccc;">MERCREDI</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ccc;">JEUDI</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ccc;">VENDREDI</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of utilisateurs" style="background: #f9f9f9; border: 1px solid #e0e0e0;">
                <td style="padding: 12px; border: 1px solid #ccc; font-weight: 600;">{{ user.prenom }} {{ user.nom }}</td>
                <td *ngFor="let jour of joursSemaine" style="padding: 12px; text-align: center; border: 1px solid #ccc;">
                  <div [style.backgroundColor]="getCouleurForJour(user.id, jour)" style="padding: 8px; border-radius: 4px; color: white; font-weight: 500; font-size: 12px;">
                    {{ getTextForJour(user.id, jour) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SI UTILISATEUR PAS DETECTE -->
    <div *ngIf="!currentUserId" style="padding: 40px; text-align: center; color: #999;">
      <p>Veuillez vous connecter d'abord</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class Semenier implements OnInit {
  
  utilisateurs: any[] = [];
  allWeeks: any = {};
  mySelectedWeek: any = null;
  myWeek: any = {};
  joursSemaine = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
  currentUserId: number | null = null;

  ngOnInit() {
    this.loadUtilisateurs();
    this.loadAllWeeks();
    this.detectCurrentUser();
    
    if (this.currentUserId) {
      this.mySelectedWeek = this.obtenirSemaines()[0];
      this.loadMyWeek();
    }
  }

  detectCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.id) {
        this.currentUserId = user.id;
        return;
      }
    }

    const saved = sessionStorage.getItem('currentUserId');
    if (saved) {
      this.currentUserId = parseInt(saved);
      return;
    }

    this.currentUserId = 1;
  }

  loadUtilisateurs() {
    const stored = localStorage.getItem('utilisateurs');
    if (stored) {
      this.utilisateurs = JSON.parse(stored);
    } else {
      this.utilisateurs = [
        { id: 1, prenom: 'Ferid', nom: 'Admin', role: 'ADMIN' },
        { id: 2, prenom: 'Tech', nom: 'One', role: 'TECHNICIEN' },
        { id: 3, prenom: 'KIA', nom: 'Manager', role: 'TECHNICIEN_SUP' },
        { id: 4, prenom: 'Aurélien', nom: 'Manager', role: 'MANAGER' },
        { id: 5, prenom: 'Odile', nom: 'Manager', role: 'MANAGER' }
      ];
      localStorage.setItem('utilisateurs', JSON.stringify(this.utilisateurs));
    }
  }

  loadAllWeeks() {
    const stored = localStorage.getItem('semeniersGlobal');
    if (stored) {
      this.allWeeks = JSON.parse(stored);
    } else {
      this.allWeeks = {};
    }
  }

  loadMyWeek() {
    if (!this.mySelectedWeek || !this.currentUserId) return;

    const key = `${this.currentUserId}_${this.mySelectedWeek.dateDebut}`;
    
    if (this.allWeeks[key]) {
      this.myWeek = JSON.parse(JSON.stringify(this.allWeeks[key]));
    } else {
      this.myWeek = {};
      this.joursSemaine.forEach(jour => {
        this.myWeek[jour] = {
          journeeComplete: true,
          localisation: 'BUREAU',
          matin: 'BUREAU',
          apresMidi: 'BUREAU',
          heureSortie: '15:00'
        };
      });
    }
  }

  toggleJourneeComplete(jour: string) {
    if (this.myWeek[jour].journeeComplete) {
      this.myWeek[jour].localisation = 'BUREAU';
    }
  }

 validerMaSemaine() {
  if (!this.currentUserId || !this.mySelectedWeek) return;
  
  const key = `${this.currentUserId}_${this.mySelectedWeek.dateDebut}`;
  this.allWeeks[key] = JSON.parse(JSON.stringify(this.myWeek));
  localStorage.setItem('semeniersGlobal', JSON.stringify(this.allWeeks));
  
  // ⭐ RECHARGER depuis localStorage
  this.loadAllWeeks();
  
  // ⭐ Dire à Angular que ça a changé
  this.allWeeks = { ...this.allWeeks };
  
  alert('✅ Ta semaine est validée!');
}

  getTextForJour(userId: number, jour: string): string {
    if (!this.mySelectedWeek) return 'N/A';
    
    const key = `${userId}_${this.mySelectedWeek.dateDebut}`;
    const weekData = this.allWeeks[key];

    if (!weekData || !weekData[jour]) {
      return 'Non rempli';
    }

    const jour_data = weekData[jour];

    if (jour_data.journeeComplete) {
      return jour_data.localisation;
    } else {
      if (jour_data.apresMidi === 'SORTIE') {
        return `${jour_data.matin} / SORTIE ${jour_data.heureSortie}`;
      } else {
        return `${jour_data.matin} / ${jour_data.apresMidi}`;
      }
    }
  }

  getCouleurForJour(userId: number, jour: string): string {
    const text = this.getTextForJour(userId, jour);

    if (text.includes('BUREAU')) return '#1976D2';
    if (text.includes('DISTANCE')) return '#FF9800';
    if (text.includes('DEPLACEMENT')) return '#9C27B0';
    if (text.includes('SORTIE')) return '#F44336';
    if (text.includes('CONGE')) return '#F44336';
    if (text.includes('Non rempli')) return '#BDBDBD';
    
    return '#9E9E9E';
  }

  getCurrentUserName(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  }

  getCurrentUserRole(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? user.role : '';
  }

  obtenirSemaines() {
    const semaines = [];
    const aujourd = new Date();
    
    for (let i = 0; i < 6; i++) {
      const lundi = new Date(aujourd);
      lundi.setDate(aujourd.getDate() - aujourd.getDay() + 1 + (i * 7));
      
      const dimanche = new Date(lundi);
      dimanche.setDate(lundi.getDate() + 6);
      
      const numSemaine = Math.ceil((lundi.getDate()) / 7);
      
      semaines.push({
        dateDebut: lundi.toLocaleDateString('fr-FR'),
        dateFin: dimanche.toLocaleDateString('fr-FR'),
        semaine: `Semaine ${numSemaine} (${lundi.toLocaleDateString('fr-FR')} - ${dimanche.toLocaleDateString('fr-FR')})`
      });
    }
    
    return semaines;
  }
}