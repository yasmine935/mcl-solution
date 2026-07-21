import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:8080/api/visiteurs';

@Component({
  selector: 'app-ecran-visiteur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecran-visiteur.html',
  styleUrl: './ecran-visiteur.css'
})
export class EcranVisiteur implements OnInit, OnDestroy {
  heureActuelle = '';
  secondesActuelles = '';
  dateActuelle = '';
  nomsVisiteurs = '';
  private timer: any;
  private visiteursTimer: any;

  readonly jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  readonly mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

  constructor(private readonly cdr: ChangeDetectorRef, private readonly http: HttpClient) {}

  ngOnInit() {
    this.majHeure();
    this.timer = setInterval(() => {
      this.majHeure();
      this.cdr.detectChanges();
    }, 1000);

    this.loadVisiteurs();
    this.visiteursTimer = setInterval(() => this.loadVisiteurs(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    clearInterval(this.visiteursTimer);
  }

  loadVisiteurs() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        const noms = (data || []).map(v => v.nom).filter(n => n && n.trim());
        this.nomsVisiteurs = noms.length <= 1
          ? (noms[0] || '')
          : noms.slice(0, -1).join(', ') + ' & ' + noms[noms.length - 1];
        this.cdr.detectChanges();
      },
      error: () => { this.nomsVisiteurs = ''; }
    });
  }

  majHeure() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    this.heureActuelle = `${h}:${m}`;
    this.secondesActuelles = s;
    this.dateActuelle = `${this.jours[now.getDay()]} ${now.getDate()} ${this.mois[now.getMonth()]} ${now.getFullYear()}`;
  }
}
