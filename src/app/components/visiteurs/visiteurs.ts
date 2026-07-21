import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

const API = 'http://localhost:8080/api/visiteurs';

@Component({
  selector: 'app-visiteurs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './visiteurs.html',
  styleUrl: './visiteurs.css'
})
export class Visiteurs implements OnInit {
  visiteurs: any[] = [];
  nouveauNom = '';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadVisiteurs(); }

  loadVisiteurs() {
    this.http.get<any[]>(API).subscribe({
      next: data => this.visiteurs = data,
      error: () => this.visiteurs = []
    });
  }

  ajouterVisiteur() {
    const nom = this.nouveauNom.trim();
    if (!nom) return;
    this.http.post<any>(API, { nom }).subscribe({
      next: () => { this.loadVisiteurs(); this.nouveauNom = ''; },
      error: () => alert('Erreur lors de l\'ajout du visiteur')
    });
  }

  supprimerVisiteur(id: number) {
    this.http.delete(`${API}/${id}`).subscribe({
      next: () => this.visiteurs = this.visiteurs.filter((v: any) => v.id !== id),
      error: () => alert('Erreur lors de la suppression')
    });
  }
}
