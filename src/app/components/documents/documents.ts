import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  documents: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  showDetailModal = false;
  selectedDocument: any = null;
  searchText = '';

  categories = ['Contrats', 'RH', 'Financier', 'Technique', 'Administratif', 'Autre'];

  nouveauDocument = {
    nom: '', categorie: 'Administratif', description: '',
    fichier: null as any, fichierNom: '', fichierTaille: ''
  };

  documentEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadDocuments(); }

  loadDocuments() {
    const stored = localStorage.getItem('documents');
    this.documents = stored ? JSON.parse(stored) : [];
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.nouveauDocument.fichier = file;
      this.nouveauDocument.fichierNom = file.name;
      this.nouveauDocument.fichierTaille = (file.size / 1024).toFixed(2);
    }
  }

  onFileSelectEdit(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.documentEnEdition.fichierNom = file.name;
      this.documentEnEdition.fichierTaille = (file.size / 1024).toFixed(2);
    }
  }

  ajouterDocument() {
    if (!this.nouveauDocument.nom || !this.nouveauDocument.fichierNom) {
      alert('Veuillez remplir le nom et ajouter un fichier');
      return;
    }
    const idIncrement = Math.max(...this.documents.map((d: any) => d.id || 0), 0) + 1;
    const doc = {
      id: idIncrement,
      nom: this.nouveauDocument.nom,
      categorie: this.nouveauDocument.categorie,
      description: this.nouveauDocument.description,
      fichierNom: this.nouveauDocument.fichierNom,
      fichierTaille: this.nouveauDocument.fichierTaille,
      dateAjout: new Date().toLocaleString('fr-FR'),
      dateModification: new Date().toLocaleString('fr-FR'),
      auteur: 'Admin'
    };
    this.documents.push(doc);
    localStorage.setItem('documents', JSON.stringify(this.documents));
    this.resetFormAdd();
    this.showFormAdd = false;
  }

  ouvrirEdition(document: any) {
    this.documentEnEdition = { ...document };
    this.selectedDocument = document;
    this.showFormEdit = true;
  }

  modifierDocument() {
    if (!this.documentEnEdition.nom) {
      alert('Veuillez remplir le nom du document');
      return;
    }
    const index = this.documents.findIndex((d: any) => d.id === this.selectedDocument.id);
    if (index !== -1) {
      this.documentEnEdition.dateModification = new Date().toLocaleString('fr-FR');
      this.documents[index] = { ...this.documentEnEdition };
      localStorage.setItem('documents', JSON.stringify(this.documents));
      this.resetFormEdit();
      this.showFormEdit = false;
    }
  }

  supprimerDocument(id: number) {
    if (confirm('Supprimer ce document ?')) {
      this.documents = this.documents.filter((d: any) => d.id !== id);
      localStorage.setItem('documents', JSON.stringify(this.documents));
    }
  }

  telechargerDocument(document: any) {
    alert(`Téléchargement de: ${document.fichierNom}`);
  }

  ouvrirDetailModal(document: any) {
    this.selectedDocument = document;
    this.showDetailModal = true;
  }

  fermerDetailModal() {
    this.showDetailModal = false;
    this.selectedDocument = null;
  }

  resetFormAdd() {
    this.nouveauDocument = {
      nom: '', categorie: 'Administratif', description: '',
      fichier: null, fichierNom: '', fichierTaille: ''
    };
  }

  resetFormEdit() { this.documentEnEdition = {}; }

  getDocumentsFiltres(): any[] {
    if (!this.searchText) return this.documents;
    return this.documents.filter((d: any) =>
      d.nom?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.categorie?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.description?.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // ✅ Couleur par catégorie
  getCategoryColor(categorie: string): string {
    const colors: any = {
      'Contrats': '#e91e63', 'RH': '#1565c0', 'Financier': '#2e7d32',
      'Technique': '#e65100', 'Administratif': '#6a1b9a', 'Autre': '#546e7a'
    };
    return colors[categorie] || '#546e7a';
  }

  getCategoryBg(categorie: string): string {
    const bgs: any = {
      'Contrats': '#fce4ec', 'RH': '#e3f2fd', 'Financier': '#e8f5e9',
      'Technique': '#fff3e0', 'Administratif': '#f3e5f5', 'Autre': '#eceff1'
    };
    return bgs[categorie] || '#eceff1';
  }

  // ✅ Emoji par type de fichier
  getFileEmoji(fileName: string): string {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: any = {
      'pdf': '📕', 'doc': '📘', 'docx': '📘',
      'xls': '📗', 'xlsx': '📗',
      'ppt': '📙', 'pptx': '📙',
      'zip': '🗜️', 'rar': '🗜️',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
      'txt': '📝', 'csv': '📊', 'mp4': '🎬', 'mp3': '🎵'
    };
    return map[ext] || '📄';
  }
}