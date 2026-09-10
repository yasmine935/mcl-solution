import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CongesApi } from '../../services/api/apis';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-conges',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './conges.html',
  styleUrl: './conges.css'
})
export class Conges implements OnInit {
  conges: any[] = [];
  filtreActif = 'TOUS';

  constructor(private congesApi: CongesApi, private router: Router) {}

  ngOnInit() { this.loadConges(); }

  loadConges() {
    this.congesApi.lister<any>().subscribe({
      next: (data) => {
        // ESSAN ne valide que les congés personnels de Ferid (ADMIN/FERID)
        this.conges = data.filter((c: any) => c.utilisateur?.role === 'ADMINISTRATEUR');
      },
      error: () => this.conges = []
    });
  }

  updateStatut(id: number, statut: string) {
    this.congesApi.changerStatut(id, statut)
      .subscribe(() => this.loadConges());
  }

  approuver(id: number) { this.updateStatut(id, 'APPROUVE'); }
  refuser(id: number) { this.updateStatut(id, 'REFUSE'); }
  enAttente(id: number) { this.updateStatut(id, 'EN_ATTENTE'); }

  delete(id: number) {
    if (confirm('Supprimer cette demande ?')) {
      this.congesApi.supprimer(id)
        .subscribe(() => this.loadConges());
    }
  }

  getCongesFiltres(): any[] {
    if (this.filtreActif === 'TOUS') return this.conges;
    return this.conges.filter((c: any) => c.statut === this.filtreActif);
  }

  getCount(statut: string): number {
    return this.conges.filter((c: any) => c.statut === statut).length;
  }

  getStatutIcon(statut: string): string {
    const map: any = { 'APPROUVE': '✅', 'REFUSE': '❌', 'EN_ATTENTE': '⏳' };
    return map[statut] || '❓';
  }

}