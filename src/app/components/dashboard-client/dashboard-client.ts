import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DashboardLayout, EspaceConfig } from '../../layout/dashboard-layout';
import { TicketsClientApi } from '../../services/api/apis';
import { Auth } from '../../services/auth';

const ESPACE: EspaceConfig = {
  brand: 'MCL Solutions',
  sousTitre: 'Espace Client',
  roleLabel: 'Client',
  badge: 'CLIENT',
  gradient: 'linear-gradient(180deg,#04201c 0%,#0b3d34 50%,#116152 100%)',
  accent: '#0d9488',
  accentSoft: '#ccfbf1',
  tag: '#5eead4',
  items: [
    { key: 'tickets', icon: 'confirmation_number', label: 'Mes tickets', section: 'Support' },
    { key: 'nouveau', icon: 'add_circle', label: 'Nouveau ticket' }
  ]
};

/**
 * Espace Client — dépôt et suivi des tickets du client connecté.
 * L'API (TicketsClientApi) renvoie déjà UNIQUEMENT les tickets du client
 * (cloisonnement côté serveur). Les décisions de validation/traitement
 * sont réservées aux valideurs et ne sont donc pas exposées ici.
 */
@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DashboardLayout],
  templateUrl: './dashboard-client.html',
  styleUrl: './dashboard-client.css'
})
export class DashboardClient implements OnInit {
  espace = ESPACE;
  currentPage = 'tickets';
  user: any = {};

  // ── Liste des tickets ──
  tickets: any[] = [];
  chargement = false;
  erreurChargement = '';
  filtreStatut = '';

  // ── Détail ──
  ticketSelectionne: any = null;
  detailEnCours = false;

  // ── Timeline (historique + échanges) ──
  timeline: any[] = [];
  timelineEnCours = false;
  timelineErreur = '';

  // ── Ajout de commentaire ──
  nouveauCommentaire = '';
  commentaireEnCours = false;
  commentaireErreur = '';

  // ── Formulaire « nouveau ticket » ──
  categories = ['Matériel', 'Réseau', 'Logiciel', 'Autre'];
  priorites = ['Faible', 'Moyenne', 'Haute'];
  form = { titre: '', description: '', categorie: 'Matériel', priorite: 'Moyenne' };
  formErreur = '';
  creationEnCours = false;

  // ── Message de confirmation inline (pas d'alert bloquant) ──
  feedback: { type: 'success' | 'error'; texte: string } | null = null;

  // Libellés et couleurs des statuts du cycle de vie TicketClient
  private readonly statutLabels: Record<string, string> = {
    NOUVEAU: 'Nouveau',
    EN_ATTENTE_VALIDATION: 'En attente de validation',
    VALIDE: 'Validé',
    REJETE: 'Rejeté',
    EN_COURS: 'En cours',
    RESOLU: 'Résolu',
    CLOTURE: 'Clôturé'
  };

  private readonly statutColors: Record<string, string> = {
    NOUVEAU: '#0891b2',                 // cyan/teal — ticket tout juste déposé
    EN_ATTENTE_VALIDATION: '#f59e0b',   // orange
    VALIDE: '#2563eb',                  // bleu
    REJETE: '#dc2626',                  // rouge
    EN_COURS: '#4f46e5',                // indigo
    RESOLU: '#16a34a',                  // vert
    CLOTURE: '#6b7280'                  // gris
  };

  statutsOptions = Object.keys(this.statutLabels);

  constructor(
    private readonly ticketsApi: TicketsClientApi,
    private readonly auth: Auth
  ) {}

  ngOnInit() {
    this.user = this.auth.utilisateurCourant() || {};
    this.chargerTickets();
  }

  // ══════════ LISTE ══════════

  chargerTickets() {
    this.chargement = true;
    this.erreurChargement = '';
    this.ticketsApi.lister<any>().subscribe({
      next: (data) => {
        this.tickets = data || [];
        this.chargement = false;
      },
      error: () => {
        this.erreurChargement = 'Impossible de charger vos tickets pour le moment.';
        this.tickets = [];
        this.chargement = false;
      }
    });
  }

  get ticketsFiltres(): any[] {
    if (!this.filtreStatut) return this.tickets;
    return this.tickets.filter(t => t.statut === this.filtreStatut);
  }

  get nbTotal() { return this.tickets.length; }
  get nbEnAttente() { return this.tickets.filter(t => t.statut === 'EN_ATTENTE_VALIDATION').length; }
  get nbEnCours() { return this.tickets.filter(t => t.statut === 'EN_COURS').length; }
  get nbResolus() { return this.tickets.filter(t => t.statut === 'RESOLU' || t.statut === 'CLOTURE').length; }

  // ══════════ DÉTAIL ══════════

  ouvrirDetail(ticket: any) {
    // Affichage immédiat avec la donnée de la liste, puis rafraîchissement via parId.
    this.ticketSelectionne = ticket;
    this.detailEnCours = true;
    this.commentaireErreur = '';
    this.nouveauCommentaire = '';
    this.ticketsApi.parId<any>(ticket.id).subscribe({
      next: (complet) => {
        if (complet) this.ticketSelectionne = complet;
        this.detailEnCours = false;
      },
      error: () => { this.detailEnCours = false; }
    });
    this.chargerTimeline(ticket.id);
  }

  fermerDetail() {
    this.ticketSelectionne = null;
    this.detailEnCours = false;
    this.timeline = [];
    this.timelineEnCours = false;
    this.timelineErreur = '';
    this.nouveauCommentaire = '';
    this.commentaireEnCours = false;
    this.commentaireErreur = '';
  }

  // ══════════ TIMELINE ══════════

  chargerTimeline(id: number) {
    this.timelineEnCours = true;
    this.timelineErreur = '';
    this.ticketsApi.evenements(id).subscribe({
      next: (data) => {
        this.timeline = data || [];
        this.timelineEnCours = false;
      },
      error: () => {
        this.timelineErreur = "Impossible de charger l'historique du ticket.";
        this.timeline = [];
        this.timelineEnCours = false;
      }
    });
  }

  envoyerCommentaire() {
    this.commentaireErreur = '';
    const contenu = this.nouveauCommentaire.trim();
    if (!contenu) {
      this.commentaireErreur = 'Veuillez saisir un commentaire avant de l\'envoyer.';
      return;
    }
    if (!this.ticketSelectionne?.id) return;

    const id = this.ticketSelectionne.id;
    this.commentaireEnCours = true;
    this.ticketsApi.commenter(id, contenu).subscribe({
      next: () => {
        this.commentaireEnCours = false;
        this.nouveauCommentaire = '';
        this.chargerTimeline(id);
      },
      error: () => {
        this.commentaireEnCours = false;
        this.commentaireErreur = "L'envoi du commentaire a échoué. Réessayez.";
      }
    });
  }

  // ══════════ CRÉATION ══════════

  creerTicket() {
    this.formErreur = '';
    if (!this.form.titre.trim() || !this.form.description.trim()) {
      this.formErreur = 'Le titre et la description sont obligatoires.';
      return;
    }
    this.creationEnCours = true;
    const body = {
      titre: this.form.titre.trim(),
      description: this.form.description.trim(),
      categorie: this.form.categorie,
      priorite: this.form.priorite
    };
    this.ticketsApi.creer<any>(body).subscribe({
      next: (cree) => {
        this.creationEnCours = false;
        this.feedback = {
          type: 'success',
          texte: `Ticket ${cree?.numero ? cree.numero + ' ' : ''}créé avec succès.`
        };
        this.resetForm();
        this.currentPage = 'tickets';
        this.chargerTickets();
      },
      error: () => {
        this.creationEnCours = false;
        this.formErreur = 'Une erreur est survenue lors de la création du ticket. Réessayez.';
      }
    });
  }

  resetForm() {
    this.form = { titre: '', description: '', categorie: 'Matériel', priorite: 'Moyenne' };
    this.formErreur = '';
  }

  // ══════════ HELPERS ══════════

  getStatutColor(statut: string): string {
    return this.statutColors[statut] || '#546e7a';
  }

  getStatutLabel(statut: string): string {
    return this.statutLabels[statut] || statut || '—';
  }

  getPrioriteColor(priorite: string): string {
    const map: Record<string, string> = {
      Faible: '#16a34a',
      Moyenne: '#f59e0b',
      Haute: '#dc2626'
    };
    return map[priorite] || '#546e7a';
  }

  getAuteurNom(auteur: any): string {
    if (!auteur) return 'Système';
    const nomComplet = [auteur.prenom, auteur.nom].filter(Boolean).join(' ').trim();
    return nomComplet || auteur.username || 'Utilisateur';
  }

  estCommentaireClient(ev: any): boolean {
    return ev?.auteur?.role === 'CLIENT';
  }

  getPageTitle(): string {
    const map: Record<string, string> = {
      tickets: 'Mes Tickets',
      nouveau: 'Nouveau Ticket'
    };
    return map[this.currentPage] || 'Espace Client';
  }
}
