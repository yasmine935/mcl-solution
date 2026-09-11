import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TicketsClientApi } from '../../services/api/apis';
import { Auth } from '../../services/auth';

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

/**
 * Panneau de gestion des tickets clients (valideurs MANAGER/ADMINISTRATEUR),
 * pensé pour être EMBARQUÉ dans un dashboard existant (tel que DashboardAdmin,
 * DashboardAurelien, DashboardOdile) — pas de sidebar/layout propre ici, juste le
 * contenu, avec ses propres sous-onglets internes « À traiter » / « Tous les tickets ».
 *
 * Contient la même logique que la page autonome /tickets-clients
 * (TicketsClientValideur), qui reste disponible séparément pour un accès direct.
 */
@Component({
  selector: 'app-tickets-client-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tickets-client-panel.html',
  styleUrl: './tickets-client-panel.css'
})
export class TicketsClientPanel implements OnInit {
  /** Sous-onglet interne actif (indépendant de la page hôte qui embarque ce panneau). */
  vue: 'a-traiter' | 'tous' = 'a-traiter';

  tickets: TicketClient[] = [];
  chargement = false;

  /** Commentaires optionnels saisis par ticket (clé = id du ticket). */
  commentaires: Record<number, string> = {};

  /** Bandeau d'information / d'erreur affiché en haut de page. */
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  // ── Détail / timeline ───────────────────────────────────────

  /** Ticket actuellement ouvert dans le panneau « Détail » (null = fermé). */
  ticketSelectionne: TicketClient | null = null;
  /** Événements de la timeline (historique + échanges) du ticket ouvert. */
  timeline: any[] = [];
  chargementTimeline = false;
  /** Texte de réponse en cours de saisie dans le détail. */
  nouveauCommentaire = '';
  envoiEnCours = false;
  /** Message d'erreur inline propre au panneau de détail. */
  detailErreur = '';

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
        // Si un ticket est ouvert dans le détail, on resynchronise son état
        // (statut, responsable…) et on rafraîchit sa timeline.
        const ouvert = this.ticketSelectionne;
        if (ouvert) {
          const maj = this.tickets.find((t) => t.id === ouvert.id);
          this.ticketSelectionne = maj ?? ouvert;
          this.chargerTimeline(ouvert.id);
        }
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

  // ── Actions de décision (sous-onglet « À traiter ») ──────────
  // Depuis EN_ATTENTE_VALIDATION, le valideur choisit directement entre
  // « Prendre en charge » (-> EN_COURS) ou « Rejeter » — l'étape VALIDE
  // intermédiaire n'est plus utilisée par ce flux.

  rejeter(t: TicketClient) {
    const commentaire = (this.commentaires[t.id] || '').trim() || undefined;
    this.api.rejeter(t.id, commentaire).subscribe({
      next: () => this.apresAction(t.id, `Ticket ${t.numero} rejeté.`),
      error: (err) => this.gererErreur(err)
    });
  }

  // ── Prise en charge (depuis « À traiter » ou, pour un ticket déjà VALIDE, depuis « Tous ») ─

  prendreEnCharge(t: TicketClient) {
    const commentaire = (this.commentaires[t.id] || '').trim() || undefined;
    this.api.prendreEnCharge(t.id, commentaire).subscribe({
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
    const texte = err?.status === 409
      ? 'Ce ticket vient d\'être pris par un autre valideur'
      : 'Une erreur est survenue. Veuillez réessayer.';
    this.afficherMessage(texte, 'error');
    // Si le détail est ouvert, on montre aussi l'erreur inline dans le panneau.
    if (this.ticketSelectionne) this.detailErreur = texte;
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

  // ── Détail / timeline ───────────────────────────────────────

  /** Ouvre le panneau de détail d'un ticket et charge sa timeline. */
  ouvrirDetail(t: TicketClient) {
    this.ticketSelectionne = t;
    this.nouveauCommentaire = '';
    this.detailErreur = '';
    this.chargerTimeline(t.id);
  }

  fermerDetail() {
    this.ticketSelectionne = null;
    this.timeline = [];
    this.nouveauCommentaire = '';
    this.detailErreur = '';
  }

  /** (Re)charge la timeline (historique + échanges) d'un ticket. */
  chargerTimeline(id: number) {
    this.chargementTimeline = true;
    this.api.evenements(id).subscribe({
      next: (data) => {
        this.timeline = Array.isArray(data) ? data : [];
        this.chargementTimeline = false;
      },
      error: () => {
        this.chargementTimeline = false;
        this.detailErreur = 'Impossible de charger l\'historique du ticket.';
      }
    });
  }

  /** Ajoute un commentaire (réponse au client) puis recharge la timeline. */
  repondre() {
    if (!this.ticketSelectionne) return;
    const texte = (this.nouveauCommentaire || '').trim();
    if (!texte) return; // rien n'est envoyé si vide
    const id = this.ticketSelectionne.id;
    this.envoiEnCours = true;
    this.detailErreur = '';
    this.api.commenter(id, texte).subscribe({
      next: () => {
        this.envoiEnCours = false;
        this.nouveauCommentaire = '';
        this.chargerTimeline(id);
      },
      error: () => {
        this.envoiEnCours = false;
        this.detailErreur = 'Impossible d\'envoyer le commentaire. Veuillez réessayer.';
      }
    });
  }

  /** Vrai si l'auteur de l'événement est le client (vs un intervenant interne). */
  estCommentaireClient(ev: any): boolean {
    return ev?.auteur?.role === 'CLIENT';
  }

  /** Libellé lisible de l'auteur d'un événement (null = Système). */
  auteurLabel(auteur: any): string {
    if (!auteur) return 'Système';
    const nomComplet = [auteur.prenom, auteur.nom].filter(Boolean).join(' ').trim();
    return nomComplet || auteur.username || 'Système';
  }

  // ── Présentation ────────────────────────────────────────────

  /** Classe CSS d'indicateur de statut (pastille colorée). */
  statutClass(statut: string): string {
    return 'st-' + (statut || '').toLowerCase().replace(/_/g, '-');
  }

  /** Libellé lisible d'un statut. */
  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      NOUVEAU: 'Nouveau',
      EN_ATTENTE_VALIDATION: 'En attente',
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
