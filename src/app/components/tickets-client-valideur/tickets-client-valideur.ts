import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import { TicketsClientApi } from '../../services/api/apis';
import { Auth } from '../../services/auth';

/**
 * Espace des valideurs internes des tickets clients (MANAGER + ADMINISTRATEUR).
 * Tous les valideurs reçoivent l'ensemble des tickets clients ; le premier qui
 * agit (valide / rejette / prend en charge) devient responsable du ticket.
 * Les autres le voient alors en lecture seule avec le nom du responsable.
 */
const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Tickets Clients',
  roleLabel: 'Valideur',
  badge: 'VALIDEUR',
  items: [
    { key: 'a-traiter', icon: 'inbox', label: 'À traiter', section: 'Tickets clients' },
    { key: 'tous', icon: 'list', label: 'Tous les tickets' }
  ],
  gradient: 'linear-gradient(180deg,#3a2a06 0%,#78500a 50%,#b45309 100%)',
  accent: '#b45309',
  accentSoft: '#fef3c7',
  tag: '#fcd34d'
};

interface TicketClient {
  id: number;
  numero: string;
  titre: string;
  description: string;
  categorie: string;
  priorite: string;
  statut: string;
  dateCreation: string;
  dateTraitement: string | null;
  commentaireValidation: string | null;
  traitePar: { id: number; nom: string; username: string } | null;
  client: { nom: string; username: string } | null;
}

@Component({
  selector: 'app-tickets-client-valideur',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DashboardLayout],
  templateUrl: './tickets-client-valideur.html',
  styleUrl: './tickets-client-valideur.css'
})
export class TicketsClientValideur implements OnInit {
  espace = ESPACE;
  currentPage = 'a-traiter';

  tickets: TicketClient[] = [];
  chargement = false;

  /** Commentaires optionnels saisis par ticket (clé = id du ticket). */
  commentaires: Record<number, string> = {};

  /** Bandeau d'information / d'erreur affiché en haut de page. */
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private readonly api: TicketsClientApi,
    private readonly auth: Auth
  ) {}

  ngOnInit() {
    this.charger();
  }

  // ── Chargement ──────────────────────────────────────────────

  charger() {
    this.chargement = true;
    this.api.lister<TicketClient>().subscribe({
      next: (data) => {
        this.tickets = Array.isArray(data) ? data : [];
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.afficherMessage('Impossible de charger les tickets clients.', 'error');
      }
    });
  }

  // ── Listes dérivées ─────────────────────────────────────────

  /** Tickets en attente de décision, non encore pris par un valideur. */
  get ticketsATraiter(): TicketClient[] {
    return this.tickets.filter(
      (t) => t.statut === 'EN_ATTENTE_VALIDATION' && !t.traitePar
    );
  }

  get tousLesTickets(): TicketClient[] {
    return this.tickets;
  }

  // ── Identité / responsabilité ───────────────────────────────

  private get usernameCourant(): string | undefined {
    return this.auth.utilisateurCourant()?.username;
  }

  /** Vrai si le valideur connecté est le responsable du ticket. */
  estResponsable(t: TicketClient): boolean {
    return !!t.traitePar && t.traitePar.username === this.usernameCourant;
  }

  // ── Actions de décision (page « À traiter ») ────────────────

  valider(t: TicketClient) {
    const commentaire = (this.commentaires[t.id] || '').trim() || undefined;
    this.api.valider(t.id, commentaire).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} validé.`),
      error: (err) => this.gererErreur(err)
    });
  }

  rejeter(t: TicketClient) {
    const commentaire = (this.commentaires[t.id] || '').trim() || undefined;
    this.api.rejeter(t.id, commentaire).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} rejeté.`),
      error: (err) => this.gererErreur(err)
    });
  }

  // ── Actions de suivi (page « Tous les tickets », responsable) ─

  prendreEnCharge(t: TicketClient) {
    this.api.prendreEnCharge(t.id).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} pris en charge.`),
      error: (err) => this.gererErreur(err)
    });
  }

  resoudre(t: TicketClient) {
    this.api.resoudre(t.id).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} marqué comme résolu.`),
      error: (err) => this.gererErreur(err)
    });
  }

  cloturer(t: TicketClient) {
    this.api.cloturer(t.id).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} clôturé.`),
      error: (err) => this.gererErreur(err)
    });
  }

  // ── Suite d'action / gestion d'erreur ───────────────────────

  private apresAction(id: number, succes: string) {
    delete this.commentaires[id];
    this.afficherMessage(succes, 'success');
    this.charger();
  }

  private gererErreur(err: any) {
    if (err?.status === 409) {
      this.afficherMessage('Ce ticket vient d\'être pris par un autre valideur', 'error');
    } else {
      this.afficherMessage('Une erreur est survenue. Veuillez réessayer.', 'error');
    }
    // Dans tous les cas on resynchronise l'état avec le backend.
    this.charger();
  }

  afficherMessage(texte: string, type: 'success' | 'error' | 'info') {
    this.message = texte;
    this.messageType = type;
  }

  fermerMessage() {
    this.message = '';
  }

  // ── Présentation ────────────────────────────────────────────

  getPageTitle(): string {
    const map: Record<string, string> = {
      'a-traiter': 'Tickets à traiter',
      'tous': 'Tous les tickets clients'
    };
    return map[this.currentPage] || 'Tickets Clients';
  }

  /** Classe CSS d'indicateur de statut (pastille colorée). */
  statutClass(statut: string): string {
    return 'st-' + (statut || '').toLowerCase().replace(/_/g, '-');
  }

  /** Libellé lisible d'un statut. */
  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      NOUVEAU: 'Nouveau',
      EN_ATTENTE_VALIDATION: 'En attente de validation',
      VALIDE: 'Validé',
      REJETE: 'Rejeté',
      EN_COURS: 'En cours',
      RESOLU: 'Résolu',
      CLOTURE: 'Clôturé'
    };
    return map[statut] || statut || '—';
  }

  /** Classe CSS d'indicateur de priorité. */
  prioriteClass(priorite: string): string {
    return 'pr-' + (priorite || '').toLowerCase().replace(/_/g, '-');
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR') + ' ' + d.toTimeString().substring(0, 5);
  }
}
