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
    nom: '',
    categorie: 'Administratif',
    description: '',
    fichier: null as any,
    fichierNom: '',
    fichierTaille: ''
  };

  documentEnEdition: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDocuments();
  }

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
      this.documentEnEdition.fichier = file;
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
      auteur: localStorage.getItem('currentUser') || 'Admin'
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.documents = this.documents.filter((d: any) => d.id !== id);
      localStorage.setItem('documents', JSON.stringify(this.documents));
    }
  }

  telechargerDocument(document: any) {
    alert(`Téléchargement de: ${document.fichierNom}`);
    // TODO: Implémenter le vrai téléchargement quand on aura le backend
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
      nom: '',
      categorie: 'Administratif',
      description: '',
      fichier: null,
      fichierNom: '',
      fichierTaille: ''
    };
  }

  resetFormEdit() {
    this.documentEnEdition = {};
  }

  getDocumentsFiltres(): any[] {
    return this.documents.filter((d: any) => 
      d.nom.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.categorie.toLowerCase().includes(this.searchText.toLowerCase()) ||
      d.description.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  getCategoryColor(categorie: string): string {
    const colors: any = {
      'Contrats': '#E91E63',
      'RH': '#2196F3',
      'Financier': '#4CAF50',
      'Technique': '#FF9800',
      'Administratif': '#9C27B0',
      'Autre': '#607D8B'
    };
    return colors[categorie] || '#607D8B';
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const icons: any = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'ppt': 'slideshow',
      'pptx': 'slideshow',
      'zip': 'folder_zip',
      'rar': 'folder_zip',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'txt': 'text_snippet'
    };
    return icons[ext] || 'insert_drive_file';
  }
}