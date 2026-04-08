import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

const API = 'http://localhost:8080/api/tickets';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadTickets();
  }

  // ✅ LOAD depuis le backend
  loadTickets() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => {
        this.tickets = data.map(t => this.mapFromBackend(t));
      },
      error: () => console.error('Erreur chargement tickets')
    });
  }

  // Convertit le format backend → frontend
  mapFromBackend(t: any): Ticket {
    return {
      id: t.id?.toString(),
      numero: t.numero,
      site: t.site,
      nom: t.nom,
      prenom: t.prenom,
      telephone: t.telephone,
      email: t.email,
      lieuSite: t.lieuSite,
      nomSalle: t.nomSalle,
      etage: t.etage,
      informationsAdditionnelles: t.informationsAdditionnelles,
      typeMateriel: t.typeMateriel,
      marque: t.marque,
      reference: t.reference,
      sousGarantie: t.sousGarantie,
      criticite: t.criticite,
      descriptionPanne: t.descriptionPanne,
      assigneId: t.assigne?.id?.toString() || null,
      priorite: t.priorite,
      echeance: t.echeance,
      statut: t.statut === 'EN_ATTENTE' ? 'En attente' : t.statut === 'EN_COURS' ? 'En cours' : 'Validée',
      dateCreation: t.dateCreation,
      dateValidation: t.dateValidation,
      valideePar: t.valideePar,
      fichiers: []
    };
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

  // ✅ POST vers le backend
  submitTicket() {
    if (!this.form.nom || !this.form.site || !this.form.typeMateriel || !this.form.descriptionPanne) {
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    const body = {
      site: this.form.site,
      nom: this.form.nom,
      prenom: this.form.prenom,
      telephone: this.form.telephone,
      email: this.form.email,
      lieuSite: this.form.lieuSite,
      nomSalle: this.form.nomSalle,
      etage: this.form.etage,
      informationsAdditionnelles: this.form.informationsAdditionnelles,
      typeMateriel: this.form.typeMateriel,
      marque: this.form.marque,
      reference: this.form.reference,
      sousGarantie: this.form.sousGarantie,
      criticite: this.form.criticite,
      descriptionPanne: this.form.descriptionPanne,
      priorite: this.form.priorite,
      echeance: this.form.echeance,
      statut: 'EN_ATTENTE'
    };

    this.http.post<any>(API, body).subscribe({
      next: (ticket) => {
        this.tickets.unshift(this.mapFromBackend(ticket));
        this.showForm = false;
        this.activeTab = 'attente';
        alert(`✅ Ticket ${ticket.numero} créé !`);
      },
      error: () => alert('❌ Erreur lors de la création du ticket')
    });
  }

  // ✅ PUT statut → EN_COURS
  mettreEnCours(ticket: Ticket, event: Event) {
    event.stopPropagation();
    this.http.put(`${API}/${ticket.id}/statut?statut=EN_COURS`, {}).subscribe({
      next: () => {
        ticket.statut = 'En cours';
      },
      error: () => alert('❌ Erreur')
    });
  }

  // ✅ PUT statut → VALIDEE
  validerTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    if (confirm(`Valider le ticket ${ticket.numero} ?`)) {
      const valideePar = `${this.currentUser.prenom} ${this.currentUser.nom}`;
      this.http.put(`${API}/${ticket.id}/statut?statut=VALIDEE&valideePar=${valideePar}`, {}).subscribe({
        next: () => {
          ticket.statut = 'Validée';
          ticket.dateValidation = new Date().toISOString();
          ticket.valideePar = valideePar;
        },
        error: () => alert('❌ Erreur')
      });
    }
  }

  // ✅ DELETE
  deleteTicket(ticket: Ticket, event: Event) {
    event.stopPropagation();
    if (confirm(`Supprimer le ticket ${ticket.numero} ?`)) {
      this.http.delete(`${API}/${ticket.id}`).subscribe({
        next: () => {
          this.tickets = this.tickets.filter(t => t.id !== ticket.id);
          if (this.showDetail?.id === ticket.id) this.showDetail = null;
        },
        error: () => alert('❌ Erreur suppression')
      });
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