import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
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
export class DashboardLayout implements OnChanges {
  @Input({ required: true }) config!: EspaceConfig;
  @Input() pageActive = 'home';
  @Input() pageTitle = '';
  /** Compteurs affichés à droite d'un item de nav, indexés par sa key (0/null = masqué). */
  @Input() badges: Record<string, number | string | null | undefined> = {};
  @Output() pageChange = new EventEmitter<string>();

  /** Zone de contenu défilante (voir dashboard-layout.html) — remise en haut à chaque changement de page. */
  @ViewChild('pageContentEl') pageContentEl?: ElementRef<HTMLDivElement>;

  user: any = {};
  sidebarOpen = false;

  constructor(private readonly router: Router) {
    try {
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      this.user = {};
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // La navigation interne (onglets du dashboard) ne recharge pas la page — contrairement
    // a un vrai changement d'URL, le navigateur ne remet donc jamais le defilement en haut
    // tout seul. On le fait nous-memes des que la page affichee change, y compris quand le
    // clic vient d'un item de menu tout en bas de la sidebar (la ou le defilement etait le
    // plus loin du haut).
    if (changes['pageActive'] && !changes['pageActive'].firstChange) {
      this.scrollToTop();
    }
    if (changes['pageActive']) this.memoriserDansHistorique(changes['pageActive'].firstChange);
  }

  // ── Bouton « Retour » du navigateur ──
  // Les pages internes ne changent pas l'URL : sans entrée d'historique, « Retour »
  // quitterait l'application. On empile donc une entrée (même URL, state.mclPage)
  // à chaque changement de page, et on la rejoue sur popstate. L'état existant est
  // conservé (navigationId du Router) ; l'URL étant identique, le Router ignore ces popstate.
  private pageDepuisHistorique: string | null = null;

  private memoriserDansHistorique(premiereFois: boolean) {
    if (this.pageDepuisHistorique === this.pageActive) {
      this.pageDepuisHistorique = null;   // changement provoqué par « Retour » : ne rien empiler
      return;
    }
    const state = { ...(history.state || {}), mclPage: this.pageActive };
    if (premiereFois) history.replaceState(state, '');
    else if (history.state?.mclPage !== this.pageActive) history.pushState(state, '');
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    const page = event.state?.mclPage;
    if (!page || page === this.pageActive) return;
    this.pageDepuisHistorique = page;
    this.sidebarOpen = false;
    this.pageChange.emit(page);
  }

  private scrollToTop() {
    this.pageContentEl?.nativeElement.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
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
