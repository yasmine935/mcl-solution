import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Ticket {
  id: string;
  numero: string;
  site: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  lieuSite: string;
  nomSalle: string;
  etage: string;
  informationsAdditionnelles: string;
  typeMateriel: string;
  marque: string;
  reference: string;
  sousGarantie: boolean;
  criticite: 'Faible' | 'Moyenne' | 'Importante' | 'Critique';
  descriptionPanne: string;
  assigneId: string | null;
  priorite: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  echeance: string;
  statut: 'En attente' | 'En cours' | 'Validée';
  dateCreation: string;
  dateValidation?: string;
  valideePar?: string;
  fichiers: string[];
}

@Component({
  selector: 'app-ticketing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticketing.html',
  styleUrls: ['./ticketing.css']
})
export class TicketingComponent implements OnInit {

  currentUser: any = null;
  activeTab: 'attente' | 'validee' = 'attente';
  showForm = false;
  showDetail: Ticket | null = null;
  tickets: Ticket[] = [];
  form: Partial<Ticket> = {};

  criticiteOptions = ['Faible', 'Moyenne', 'Importante', 'Critique'];
  prioriteOptions = ['Faible', 'Moyenne', 'Haute', 'Critique'];

  users = [
    { id: '1', nom: 'FERID', prenom: 'Admin' },
    { id: '2', nom: 'Technicien', prenom: 'Test' },
    { id: '3', nom: 'KIA', prenom: 'TechSup' },
    { id: '4', nom: 'BREGERE', prenom: 'Aurélien' },
    { id: '5', nom: 'ODILE', prenom: 'Manager' },
  ];

  ngOnInit() {
    const userId = localStorage.getItem('currentUserId') || '4';
    this.currentUser = this.users.find(u => u.id === userId) || this.users[3];
    this.loadTickets();
  }

  loadTickets() {
    const stored = localStorage.getItem('ticketsGlobal');
    this.tickets = stored ? JSON.parse(stored) : [];
  }

  saveTickets() {
    localStorage.setItem('ticketsGlobal', JSON.stringify(this.tickets));
  }

  get ticketsEnAttente() {
    return this.tickets.filter(t => t.statut === 'En attente' || t.statut === 'En cours');
  }
  get ticketsValides() {
    return this.tickets.filter(t => t.statut === 'Validée');
  }
  get displayedTickets() {
    return this.activeTab === 'attente' ? this.ticketsEnAttente : this.ticketsValides;
  }

  openNewForm() {
    this.form = {
      site: '', nom: '', prenom: '', telephone: '', email: '',
      lieuSite: '', nomSalle: '', etage: '', informationsAdditionnelles: '',
      typeMateriel: '', marque: '', reference: '',
      sousGarantie: false, criticite: 'Faible', descriptionPanne: '',
      assigneId: null, priorite: 'Faible', echeance: '',
      statut: 'En attente', fichiers: []
    };
    this.showForm = true;
    this.showDetail = null;
  }

  submitTicket() {
    if (!this.form.nom || !this.form.site || !this.form.typeMateriel || !this.form.descriptionPanne) {
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }
    const newTicket: Ticket = {
      ...this.form as Ticket,
      id: Date.now().toString(),
      numero: 'TKT-' + String(this.tickets.length + 1).padStart(4, '0'),
      dateCreation: new Date().toISOString(),
    };
    this.tickets.unshift(newTicket);
    this.saveTickets();
    this.showForm = false;
    this.activeTab = 'attente';
    alert(`✅ Ticket ${newTicket.numero} créé avec succès !`);
  }

  validerTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    if (confirm(`Valider le ticket ${ticket.numero} ? Le problème a été résolu.`)) {
      ticket.statut = 'Validée';
      ticket.dateValidation = new Date().toISOString();
      ticket.valideePar = `${this.currentUser.prenom} ${this.currentUser.nom}`;
      this.saveTickets();
    }
  }

  mettreEnCours(ticket: Ticket, event: Event) {
    event.stopPropagation();
    ticket.statut = 'En cours';
    this.saveTickets();
  }

  deleteTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    if (confirm(`Supprimer le ticket ${ticket.numero} ?`)) {
      this.tickets = this.tickets.filter(t => t.id !== ticket.id);
      this.saveTickets();
      if (this.showDetail?.id === ticket.id) this.showDetail = null;
    }
  }

  viewDetail(ticket: Ticket) {
    this.showDetail = { ...ticket };
    this.showForm = false;
  }

  cancel() {
    this.showForm = false;
    this.showDetail = null;
  }

  getUserName(id: string | null): string {
    if (!id) return 'Non attribué';
    const u = this.users.find(u => u.id === id);
    return u ? `${u.prenom} ${u.nom}` : 'Inconnu';
  }

  getCritClass(val: string): string {
    const map: any = {
      'Faible': 'badge-faible', 'Moyenne': 'badge-moyenne',
      'Importante': 'badge-importante', 'Critique': 'badge-critique', 'Haute': 'badge-importante'
    };
    return map[val] || '';
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toTimeString().substring(0, 5);
  }
}