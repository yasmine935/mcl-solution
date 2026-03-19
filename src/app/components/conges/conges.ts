import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-conges',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './conges.html',
  styleUrl: './conges.css'
})
export class Conges implements OnInit {
  conges: any[] = [];
  displayedColumns = ['employe', 'type', 'dateDebut', 'dateFin', 'motif', 'statut', 'actions'];
  private apiUrl = 'http://localhost:8080/api/conges';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadConges();
  }

  loadConges() {
    this.http.get<any[]>(this.apiUrl).subscribe(data => {
      this.conges = data;
    });
  }

  updateStatut(id: number, statut: string) {
    this.http.put(`${this.apiUrl}/${id}/statut?statut=${statut}`, {})
      .subscribe(() => this.loadConges());
  }

  approuver(id: number) { this.updateStatut(id, 'APPROUVE'); }
  refuser(id: number) { this.updateStatut(id, 'REFUSE'); }
  enAttente(id: number) { this.updateStatut(id, 'EN_ATTENTE'); }

  delete(id: number) {
    if (confirm('Supprimer cette demande ?')) {
      this.http.delete(`${this.apiUrl}/${id}`)
        .subscribe(() => this.loadConges());
    }
  }
}