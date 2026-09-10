import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CategoriesTachesApi } from '../../services/api/apis';

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

  constructor(private api: CategoriesTachesApi) {}

  ngOnInit() { this.loadCategories(); }

  loadCategories() {
    this.api.lister<any>().subscribe({
      next: data => this.categories = data,
      error: () => this.categories = []
    });
  }

  ajouterCategorie() {
    const nom = this.nouvelleCategorie.trim();
    if (!nom) return;
    this.api.creer<any>({ nom }).subscribe({
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
    this.api.modifier<any>(id, { nom }).subscribe({
      next: () => { this.loadCategories(); this.annulerEditionNom(); },
      error: () => alert('Erreur lors de la modification')
    });
  }

  supprimerCategorie(id: number) {
    if (!confirm('Supprimer cette catégorie et toutes ses options ?')) return;
    this.api.supprimer(id).subscribe({
      next: () => this.loadCategories(),
      error: () => alert('Erreur lors de la suppression')
    });
  }

  ajouterOption(categorieId: number) {
    const nom = (this.nouvelleOptionParCategorie[categorieId] || '').trim();
    if (!nom) return;
    this.api.post<any>(`${categorieId}/options`, { nom }).subscribe({
      next: () => { this.loadCategories(); this.nouvelleOptionParCategorie[categorieId] = ''; },
      error: () => alert('Erreur lors de l\'ajout de l\'option')
    });
  }

  supprimerOption(optionId: number) {
    this.api.delete(`options/${optionId}`).subscribe({
      next: () => this.loadCategories(),
      error: () => alert('Erreur lors de la suppression')
    });
  }

  getInitiales(nom: string): string {
    if (!nom) return '?';
    const parts = nom.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nom.substring(0, 2).toUpperCase();
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1565c0', '#6a1b9a', '#2e7d32', '#e65100', '#00695c', '#ad1457', '#37474f'];
    return colors[nom ? nom.charCodeAt(0) % colors.length : 0];
  }
}
