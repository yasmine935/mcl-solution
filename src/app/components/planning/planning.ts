import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="currentUserId" style="padding: 20px; background: white; border-radius: 8px;">
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #4CAF50; padding-bottom: 15px;">
        <h3 style="color: #4CAF50; margin: 0;">📅 {{ getCurrentUserName() }} - Planning</h3>
        <span style="font-size: 12px; color: #666;">{{ getCurrentUserRole() }}</span>
      </div>

      <!-- NAVIGATION MOIS -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button (click)="previousMonth()" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">← Mois précédent</button>
        <h4 style="color: #4CAF50; margin: 0;">{{ getMoisAnnee() }}</h4>
        <button (click)="nextMonth()" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Mois suivant →</button>
      </div>

      <!-- CALENDRIER -->
      <div style="background: #E8F5E9; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 2px solid #4CAF50;">
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
          <!-- JOURS DE LA SEMAINE -->
          <div *ngFor="let jour of joursAbbr" style="text-align: center; font-weight: 600; color: #4CAF50; padding: 10px;">
            {{ jour }}
          </div>

          <!-- JOURS DU MOIS -->
          <ng-container *ngFor="let jour of joursAffiche">
            <div [style.backgroundColor]="jour.jour !== 0 ? '#fff' : '#f5f5f5'" style="border: 1px solid #ddd; border-radius: 6px; padding: 10px; min-height: 100px; cursor: pointer;" (click)="ouvrirJour(jour)">
              <!-- JOUR GRIS (autres mois) -->
              <div *ngIf="jour.jour === 0" style="text-align: center; color: #ccc; font-weight: 600; font-size: 14px;">
                {{ jour.affichage }}
              </div>

              <!-- JOUR NORMAL -->
              <div *ngIf="jour.jour !== 0">
                <div style="text-align: right; font-weight: 600; color: #4CAF50; margin-bottom: 5px;">{{ jour.affichage }}</div>
                
                <!-- NOTE DU JOUR -->
                <div [style.backgroundColor]="jour.note ? '#C8E6C9' : 'transparent'" style="padding: 5px; border-radius: 3px; font-size: 12px; min-height: 60px; overflow: auto;">
                  <span *ngIf="jour.note" style="color: #333;">{{ jour.note }}</span>
                  <span *ngIf="!jour.note" style="color: #ccc; font-size: 11px;">Ajouter note...</span>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- MODAL AJOUTER NOTE -->
      <div *ngIf="showModal && selectedJour" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;" (click)="closeModal()">
        <div style="background: white; padding: 25px; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" (click)="$event.stopPropagation()">
          <h4 style="color: #4CAF50; margin: 0 0 15px 0;">📝 {{ selectedJour.affichage }} {{ getMoisAnnee() }}</h4>
          
          <label style="font-weight: 600; display: block; margin-bottom: 8px;">Note (ex: Congé, RTT, Fournisseur, Partir extra...):</label>
          <textarea [(ngModel)]="selectedJour.note" placeholder="Ajoute une note..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; box-sizing: border-box; font-family: inherit;"></textarea>

          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button (click)="sauvegarderNote()" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
              ✓ Sauvegarder
            </button>
            <button (click)="closeModal()" style="flex: 1; padding: 10px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Annuler
            </button>
          </div>
        </div>
      </div>

      <!-- TABLEAU GLOBAL - TOUT LE MONDE -->
      <div>
        <h4 style="color: #4CAF50; margin: 0 0 20px 0;">📊 PLANNING TOUTE L'ÉQUIPE - {{ getMoisAnnee() }}</h4>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #4CAF50; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ccc;">PERSONNE</th>
                <ng-container *ngFor="let jour of joursAffiche">
                  <th *ngIf="jour.jour !== 0" style="padding: 8px; text-align: center; border: 1px solid #ccc; font-size: 11px;">
                    {{ jour.affichage }}
                  </th>
                </ng-container>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of utilisateurs" style="background: #f9f9f9; border: 1px solid #e0e0e0;">
                <td style="padding: 12px; border: 1px solid #ccc; font-weight: 600;">{{ user.prenom }} {{ user.nom }}</td>
                <ng-container *ngFor="let jour of joursAffiche">
                  <td *ngIf="jour.jour !== 0" style="padding: 8px; text-align: center; border: 1px solid #ccc; font-size: 11px;">
                    <div [style.backgroundColor]="getNotesForUser(user.id, jour.jour) ? '#C8E6C9' : 'transparent'" style="padding: 4px; border-radius: 3px;">
                      {{ getNotesForUser(user.id, jour.jour) || '-' }}
                    </div>
                  </td>
                </ng-container>
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
export class Planning implements OnInit {
  
  utilisateurs: any[] = [];
  allNotes: any = {};
  currentUserId: number | null = null;
  
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  
  joursAbbr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  joursAffiche: any[] = [];
  
  showModal = false;
  selectedJour: any = null;

  ngOnInit() {
    this.loadUtilisateurs();
    this.loadAllNotes();
    this.detectCurrentUser();
    this.generateCalendrier();
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
    this.currentUserId = 1;
  }

  loadUtilisateurs() {
    const stored = localStorage.getItem('utilisateurs');
    this.utilisateurs = stored ? JSON.parse(stored) : [
      { id: 1, prenom: 'Ferid', nom: 'Admin', role: 'ADMIN' },
      { id: 2, prenom: 'Tech', nom: 'One', role: 'TECHNICIEN' },
      { id: 3, prenom: 'KIA', nom: 'Manager', role: 'TECHNICIEN_SUP' },
      { id: 4, prenom: 'Aurélien', nom: 'Manager', role: 'MANAGER' },
      { id: 5, prenom: 'Odile', nom: 'Manager', role: 'MANAGER' }
    ];
    if (!stored) localStorage.setItem('utilisateurs', JSON.stringify(this.utilisateurs));
  }

  loadAllNotes() {
    const stored = localStorage.getItem('planningNotes');
    this.allNotes = stored ? JSON.parse(stored) : {};
  }

  generateCalendrier() {
    this.joursAffiche = [];
    
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 1) {
      const jour = currentDate.getDate();
      const mois = currentDate.getMonth();
      const annee = currentDate.getFullYear();
      
      const key = `${this.currentUserId}_${annee}-${mois + 1}-${jour}`;
      
      this.joursAffiche.push({
        jour: mois === this.currentMonth ? jour : 0,
        affichage: jour,
        date: new Date(annee, mois, jour),
        note: this.allNotes[key] || '',
        key: key
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendrier();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendrier();
  }

  ouvrirJour(jour: any) {
    if (jour.jour !== 0) {
      this.selectedJour = jour;
      this.showModal = true;
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedJour = null;
  }

  sauvegarderNote() {
    if (this.selectedJour) {
      this.allNotes[this.selectedJour.key] = this.selectedJour.note;
      localStorage.setItem('planningNotes', JSON.stringify(this.allNotes));
      
      this.loadAllNotes();
      this.generateCalendrier();
      
      alert('✅ Note sauvegardée!');
      this.closeModal();
    }
  }

  getNotesForUser(userId: number, jour: number): string {
    const key = `${userId}_${this.currentYear}-${this.currentMonth + 1}-${jour}`;
    return this.allNotes[key] || '';
  }

  getMoisAnnee(): string {
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${mois[this.currentMonth]} ${this.currentYear}`;
  }

  getCurrentUserName(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  }

  getCurrentUserRole(): string {
    const user = this.utilisateurs.find(u => u.id === this.currentUserId);
    return user ? user.role : '';
  }
}