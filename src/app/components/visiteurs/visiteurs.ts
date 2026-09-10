import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { VisiteursApi } from '../../services/api/apis';

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

  constructor(private visiteursApi: VisiteursApi) {}

  ngOnInit() { this.loadVisiteurs(); }

  loadVisiteurs() {
    this.visiteursApi.lister<any>().subscribe({
      next: data => this.visiteurs = data,
      error: () => this.visiteurs = []
    });
  }

  ajouterVisiteur() {
    const nom = this.nouveauNom.trim();
    if (!nom) return;
    this.visiteursApi.creer<any>({ nom }).subscribe({
      next: () => { this.loadVisiteurs(); this.nouveauNom = ''; },
      error: () => alert('Erreur lors de l\'ajout du visiteur')
    });
  }

  supprimerVisiteur(id: number) {
    this.visiteursApi.supprimer(id).subscribe({
      next: () => this.visiteurs = this.visiteurs.filter((v: any) => v.id !== id),
      error: () => alert('Erreur lors de la suppression')
    });
  }
}
