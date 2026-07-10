import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API = 'http://localhost:8080/api/clients';

@Component({
  selector: 'app-gestion-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css'
})
export class GestionClients implements OnInit {
  @Input() modeConsultation = false;
  clients: any[] = [];
  showForm = false;
  editingClient: any = null;
  showEditModal = false;
  showDetailModal = false;
  selectedClient: any = null;
  recherche = '';
  showInactifs = false;
  currentUser: any = {};

  form = { nom: '', codeClient: '', email: '', adresse: '', contact: '', responsableCommercial: '', typeClient: 'Client',
    interlocuteurAchat: '', interlocuteurFacture: '', interlocuteurCommercial: '', interlocuteurAutres: '' };
  readonly typesClient = ['Client', 'Prospect'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadClients();
  }

  loadClients() {
    this.http.get<any[]>(API).subscribe({
      next: data => this.clients = data,
      error: () => this.clients = []
    });
  }

  ajouter() {
    if (!this.form.nom.trim()) { alert('Le nom du client est obligatoire'); return; }
    this.http.post<any>(API, { ...this.form }).subscribe({
      next: () => { this.loadClients(); this.resetForm(); this.showForm = false; },
      error: () => alert('Erreur lors de l\'ajout du client')
    });
  }

  ouvrirEdition(client: any) {
    this.editingClient = { ...client };
    this.showEditModal = true;
  }

  sauvegarderEdition() {
    if (!this.editingClient?.nom?.trim()) return;
    this.http.put<any>(`${API}/${this.editingClient.id}`, this.editingClient).subscribe({
      next: () => { this.loadClients(); this.fermerEditModal(); },
      error: () => alert('Erreur lors de la modification')
    });
  }

  desactiver(id: number, nomClient: string) {
    const nomUser = `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || this.currentUser.username || 'Admin';
    if (confirm(`Désactiver le client "${nomClient}" ? Il restera visible dans l'historique.`)) {
      this.http.put<any>(`${API}/${id}/desactiver?desactivePar=${encodeURIComponent(nomUser)}`, {}).subscribe({
        next: () => { this.loadClients(); this.fermerDetail(); },
        error: () => alert('Erreur lors de la désactivation')
      });
    }
  }

  reactiver(id: number) {
    this.http.put<any>(`${API}/${id}/reactiver`, {}).subscribe({
      next: () => this.loadClients(),
      error: () => alert('Erreur lors de la réactivation')
    });
  }

  clientsFiltres(): any[] {
    let liste = this.showInactifs
      ? this.clients
      : this.clients.filter(c => c.actif !== false);
    if (!this.recherche.trim()) return liste;
    const q = this.recherche.toLowerCase().trim();
    return liste.filter(c =>
      (c.nom || '').toLowerCase().includes(q) ||
      (c.codeClient || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.adresse || '').toLowerCase().includes(q) ||
      (c.contact || '').toLowerCase().includes(q)
    );
  }

  get countInactifs(): number {
    return this.clients.filter(c => c.actif === false).length;
  }

  getInitiales(nom: string): string {
    if (!nom) return '?';
    const parts = nom.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nom.substring(0, 2).toUpperCase();
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1565c0', '#6a1b9a', '#2e7d32', '#e65100', '#00695c', '#c62828', '#37474f'];
    return colors[nom ? nom.charCodeAt(0) % colors.length : 0];
  }

  resetForm() {
    this.form = { nom: '', codeClient: '', email: '', adresse: '', contact: '', responsableCommercial: '', typeClient: 'Client',
      interlocuteurAchat: '', interlocuteurFacture: '', interlocuteurCommercial: '', interlocuteurAutres: '' };
  }

  ouvrirDetail(c: any) { this.selectedClient = c; this.showDetailModal = true; }
  fermerDetail() { this.showDetailModal = false; this.selectedClient = null; }

  fermerEditModal() { this.showEditModal = false; this.editingClient = null; }
}
