import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const API_FICHES = 'http://localhost:8080/api/fiches-intervention';

@Component({
  selector: 'app-fiches-completees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './fiches-completees.html',
  styleUrl: './fiches-completees.css'
})
export class FichesCompletees implements OnInit {
  fichesCompletees: any[] = [];
  selectedFiche: any = null;
  showDetailModal = false;
  filterStatut = 'PENDING';
  rechercheFC = '';
  currentUser: any = {};

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadFichesCompletees();
  }

  loadFichesCompletees() {
    this.http.get<any[]>(API_FICHES).subscribe({
      next: (data) => {
        this.fichesCompletees = data
          .filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE_KIA' || f.statut === 'VALIDEE')
          .map((f: any) => ({
            ...f,
            date: f.dateIntervention,
            technicienAssigne: f.technicien ? `${f.technicien.prenom} ${f.technicien.nom}` : '',
            approuvePar: f.approuvePar || (f.statut === 'VALIDEE' ? 'Manager' : null),
            confirmeParKia: f.confirmeParKia || null,
            dateConfirmationKia: f.dateConfirmationKia || null,
            signatureTechnicien: f.signatureTechnicien || '',
            signatureClient: f.signatureClient || '',
            nomClientSigne: f.nomClientSigne || '',
            heureDebut: f.heureDebut || '',
            heureFin: f.heureFin || '',
            intervenants: f.intervenants || '',
            taches: this.parseJson(f.taches),
            materielsHorsStandard: this.parseJson(f.materielsHorsStandard),
            photos: this.parseJson(f.photos),
            documentsImportes: this.parseJson(f.documentsImportes)
          }));
      },
      error: () => this.fichesCompletees = []
    });
  }

  isKia(): boolean { return this.currentUser?.role === 'TECHNICIEN_SUP'; }

  getFichesAffichees(): any[] {
    let liste = this.fichesCompletees;
    if (this.filterStatut === 'PENDING') liste = liste.filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE_KIA');
    else if (this.filterStatut === 'VALIDEE') liste = liste.filter((f: any) => f.statut === 'VALIDEE');
    if (this.rechercheFC.trim()) {
      const q = this.rechercheFC.toLowerCase().trim();
      liste = liste.filter((f: any) =>
        (f.numProjet || '').toLowerCase().includes(q) ||
        (f.client || '').toLowerCase().includes(q) ||
        (f.technicienAssigne || '').toLowerCase().includes(q)
      );
    }
    return liste;
  }

  ouvrirDetail(fiche: any) { this.selectedFiche = structuredClone(fiche); this.showDetailModal = true; }
  fermerDetail() { this.showDetailModal = false; this.selectedFiche = null; }

  private getMimeType(doc: any): string {
    if (doc.mimeType) return doc.mimeType;
    if (doc.nom?.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return 'image/';
    if (doc.nom?.match(/\.pdf$/i)) return 'application/pdf';
    return '';
  }

  private dataUrlToBlobUrl(dataUrl: string): string {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/data:(.*?);base64/)?.[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  ouvrirDocument(doc: any) {
    const dataUrl = doc.data || doc.dataUrl;
    if (!dataUrl) { alert('Fichier non disponible — réimportez-le depuis la fiche.'); return; }
    const mimeType = this.getMimeType(doc);
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      // Chrome bloque l'ouverture directe d'une URL data: dans un nouvel onglet (onglet vide) — on passe par un blob URL
      const url = dataUrl.startsWith('data:') ? this.dataUrlToBlobUrl(dataUrl) : dataUrl;
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = doc.nom || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  confirmerKia(fiche: any) {
    const nom = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    if (!confirm('Confirmer ce travail en tant que Technicien Supérieur ?')) return;
    this.http.put<any>(`${API_FICHES}/${fiche.id}/confirmer-kia`, { confirmePar: nom }).subscribe({
      next: () => {
        fiche.statut = 'VALIDEE_KIA';
        fiche.confirmeParKia = nom;
        this.loadFichesCompletees();
        this.fermerDetail();
      },
      error: () => alert('Erreur lors de la confirmation')
    });
  }

  validerFiche(fiche: any) {
    if (fiche.statut !== 'VALIDEE_KIA') {
      alert('Ce travail doit d\'abord être confirmé par KIA (Technicien Supérieur).');
      return;
    }
    const nomManager = `${this.currentUser.prenom} ${this.currentUser.nom}`;
    if (confirm('Valider le travail du technicien ?')) {
      // 1. Mettre à jour le statut + approuvePar dans le backend
      const body = {
        approuvePar: nomManager,
        dateApprobation: new Date().toISOString()
      };
      this.http.put<any>(`${API_FICHES}/${fiche.id}/valider`, body).subscribe({
        next: () => {
          fiche.statut = 'VALIDEE';
          fiche.approuvePar = nomManager;
          alert('Fiche validee !');
          this.loadFichesCompletees();
          this.fermerDetail();
        },
        error: () => alert('Erreur validation')
      });
    }
  }

  getCountPending(): number { return this.fichesCompletees.filter((f: any) => f.statut === 'COMPLETEE' || f.statut === 'VALIDEE_KIA').length; }
  getCountValidees(): number { return this.fichesCompletees.filter((f: any) => f.statut === 'VALIDEE').length; }

  getStatutBadgeClass(statut: string): string {
    switch(statut) {
      case 'VALIDEE': return 'badge-validee';
      case 'VALIDEE_KIA': return 'badge-validee-kia';
      case 'EN_COURS': return 'badge-en-cours';
      default: return 'badge-pending';
    }
  }

  parseJson(val: any): any[] {
    if (!val) return [];
    if (typeof val === 'string') return JSON.parse(val);
    return val;
  }

  afficherSignature(signature: string): boolean {
    return !!(signature && typeof signature === 'string' && signature.startsWith('data:image'));
  }

  getPhotosNames(): string {
    if (!this.selectedFiche?.photos) return '';
    return this.selectedFiche.photos.map((p: any) => p.nom).join(', ');
  }
}