import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface NavItem {
  key: string;      // identifiant de page émis à la sélection
  icon: string;     // nom d'icône Material
  label: string;
  section?: string; // si présent, affiche un libellé de section au-dessus de l'item
  route?: string;   // si présent, le clic NAVIGUE vers cette route (au lieu de changer de page interne)
}

export interface EspaceConfig {
  brand: string;       // « MCL Groupe » / « MCL Solutions »
  sousTitre: string;   // sous-titre de la marque, ex. « Comptabilite »
  roleLabel: string;   // étiquette de la carte utilisateur, ex. « Comptable »
  badge: string;       // badge de la topbar, ex. « COMPTABILITE »
  items: NavItem[];
  // Personnalisation visuelle optionnelle (les défauts sont dans le CSS du layout)
  gradient?: string;   // fond de la sidebar
  accent?: string;     // couleur d'accent (badge topbar, bordure)
  accentSoft?: string; // variante claire de l'accent (bordure topbar)
  tag?: string;        // couleur du role-tag de la carte utilisateur
}

/**
 * Châssis commun des espaces (sidebar + topbar) piloté par une EspaceConfig.
 * Le contenu des pages est projeté ; la navigation interne passe par (pageChange).
 * Les styles responsive (hamburger, overlay, sidebar mobile) restent globaux (styles.css).
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css'
})
export class DashboardLayout {
  @Input({ required: true }) config!: EspaceConfig;
  @Input() pageActive = 'home';
  @Input() pageTitle = '';
  /** Compteurs affichés à droite d'un item de nav, indexés par sa key (0/null = masqué). */
  @Input() badges: Record<string, number | string | null | undefined> = {};
  @Output() pageChange = new EventEmitter<string>();

  user: any = {};
  sidebarOpen = false;

  constructor(private readonly router: Router) {
    try {
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      this.user = {};
    }
  }

  naviguer(item: NavItem) {
    this.sidebarOpen = false;
    if (item.route) {
      this.router.navigate([item.route]);   // lien vers un autre écran (ex. suivi des tickets client)
    } else {
      this.pageChange.emit(item.key);        // navigation interne au dashboard
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
