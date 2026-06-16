import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ecran-visiteur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-visiteur.html',
  styleUrl: './ecran-visiteur.css'
})
export class EcranVisiteur implements OnInit, OnDestroy {
  heureActuelle = '';
  dateActuelle = '';
  private timer: any;

  readonly jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  readonly mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  ngOnInit() {
    this.majHeure();
    this.timer = setInterval(() => this.majHeure(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  majHeure() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    this.heureActuelle = `${h}:${m}`;
    this.dateActuelle = `${this.jours[now.getDay()]} ${now.getDate()} ${this.mois[now.getMonth()]} ${now.getFullYear()}`;
  }
}
