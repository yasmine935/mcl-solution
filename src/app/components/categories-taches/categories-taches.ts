import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API = 'http://localhost:8080/api/categories-taches';

@Component({
  selector: 'app-categories-taches',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './categories-taches.html',
  styleUrl: './categories-taches.css'
})
export class CategoriesTaches implements OnInit {
  categories: any[] = [];
  showForm = false;
  nouvelleCategorie = '';
  categorieEnEditionId: number | null = null;
  nomEnEdition = '';
  nouvelleOptionParCategorie: { [id: number]: string } = {};

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadCategories(); }

  loadCategories() {
    this.http.get<any[]>(API).subscribe({
      next: data => this.categories = data,
      error: () => this.categories = []
    });
  }

  ajouterCategorie() {
    const nom = this.nouvelleCategorie.trim();
    if (!nom) return;
    this.http.post<any>(API, { nom }).subscribe({
      next: () => { this.loadCategories(); this.nouvelleCategorie = ''; this.showForm = false; },
      error: () => alert('Erreur lors de l\'ajout de la catégorie')
    });
  }

  ouvrirEditionNom(c: any) {
    this.categorieEnEditionId = c.id;
    this.nomEnEdition = c.nom;
  }

  annulerEditionNom() {
    this.categorieEnEditionId = null;
    this.nomEnEdition = '';
  }

  sauvegarderNom(id: number) {
    const nom = this.nomEnEdition.trim();
    if (!nom) return;
    this.http.put<any>(`${API}/${id}`, { nom }).subscribe({
      next: () => { this.loadCategories(); this.annulerEditionNom(); },
      error: () => alert('Erreur lors de la modification')
    });
  }

  supprimerCategorie(id: number) {
    if (!confirm('Supprimer cette catégorie et toutes ses options ?')) return;
    this.http.delete(`${API}/${id}`).subscribe({
      next: () => this.loadCategories(),
      error: () => alert('Erreur lors de la suppression')
    });
  }

  ajouterOption(categorieId: number) {
    const nom = (this.nouvelleOptionParCategorie[categorieId] || '').trim();
    if (!nom) return;
    this.http.post<any>(`${API}/${categorieId}/options`, { nom }).subscribe({
      next: () => { this.loadCategories(); this.nouvelleOptionParCategorie[categorieId] = ''; },
      error: () => alert('Erreur lors de l\'ajout de l\'option')
    });
  }

  supprimerOption(optionId: number) {
    this.http.delete(`${API}/options/${optionId}`).subscribe({
      next: () => this.loadCategories(),
      error: () => alert('Erreur lors de la suppression')
    });
  }
}
