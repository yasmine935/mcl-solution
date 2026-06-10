import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

const API = 'http://localhost:8080/api/fiches-intervention';

@Component({
  selector: 'app-fiche-intervention-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './fiche-intervention-manager.html',
  styleUrl: './fiche-intervention-manager.css'
})
export class FicheInterventionManager implements OnInit {
  fiches: any[] = [];
  employes: any[] = [];
  techniciens: any[] = [];
  clients: any[] = [];
  showFormAdd = false;
  showFormEdit = false;
  ficheEnEdition: any = null;
  currentUser: any = {};
  recherche = '';
  filtreStatut = '';
  filtreClient = '';

  getClientsUniques(): string[] {
    const noms = this.fiches.map((f: any) => f.client).filter((c: any) => c && c.trim());
    return [...new Set(noms)].sort();
  }

  fichesFiltrees(): any[] {
    let liste = this.fiches;
    if (this.filtreStatut) liste = liste.filter((f: any) => f.statut === this.filtreStatut);
    if (this.filtreClient) liste = liste.filter((f: any) => f.client === this.filtreClient);
    if (!this.recherche.trim()) return liste;
    const q = this.recherche.toLowerCase().trim();
    return liste.filter((f: any) =>
      (f.numProjet || '').toLowerCase().includes(q) ||
      (f.client || '').toLowerCase().includes(q) ||
      (f.technicienAssigne || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q)
    );
  }

  // ── GESTION CLIENTS ──
  showClientManager = false;
  nouveauClient: any = { nom: '', codeClient: '', adresse: '', contact: '' };

  optionsTaches: any = {
    'Installation des cameras': ['Camera HD 4K', 'Camera IP', 'Camera Thermique', 'Camera PTZ'],
    'Mise en place support mural': ['Support universel', 'Support motorise', 'Support articule', 'Support fixe'],
    'Fixation TV 65 sur Support': ['Support fixe', 'Support articule', 'Support motorise', 'Bras extensible'],
    'Connectique et Parametrage': ['HDMI 2.1', 'Ethernet', 'WiFi 6', 'Fiber Optique', 'USB-C'],
    'Test et Validation': ['Test video', 'Test audio', 'Test reseau', 'Test securite', 'Validation client']
  };

  tachesDisponibles = [
    'Installation des cameras', 'Mise en place support mural',
    'Fixation TV 65 sur Support', 'Connectique et Parametrage', 'Test et Validation'
  ];

  nouvelleFiche: any = {
    numProjet: '', client: '', dateDebut: '', dateFin: '',
    technicienAssigne: '', selectedTechIds: [] as number[],
    description: '', codeClient: '', numCommande: '', chiffreAffaire: 0,
    adresse: '', contact: '', materielsHorsStandard: [],
    nouveauMateriel: '', documentsImportes: [], taches: [],
    nouvelleTacheManuelle: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadEmployes();
    this.loadFiches();
    this.loadClients();
  }

  loadClients() {
    this.http.get<any[]>('http://localhost:8080/api/clients').subscribe({
      next: (data) => this.clients = data,
      error: () => this.clients = []
    });
  }

  ajouterClientLocal() {
    if (!this.nouveauClient.nom.trim()) { alert('Le nom du client est obligatoire'); return; }
    const client = { ...this.nouveauClient };
    this.http.post<any>('http://localhost:8080/api/clients', client).subscribe({
      next: () => {
        this.loadClients();
        this.nouveauClient = { nom: '', codeClient: '', adresse: '', contact: '' };
      },
      error: () => alert('Erreur lors de l\'ajout du client')
    });
  }

  supprimerClientLocal(index: number) {
    if (confirm('Supprimer ce client ?')) {
      const id = this.clients[index].id;
      this.http.delete(`http://localhost:8080/api/clients/${id}`).subscribe({
        next: () => this.loadClients(),
        error: () => alert('Erreur lors de la suppression')
      });
    }
  }

  onClientChange(clientNom: any, form: any) {
    const client = this.clients.find((c: any) => c.nom === clientNom);
    if (client) {
      form.client = client.nom;
      form.codeClient = client.codeClient || '';
      form.adresse = client.adresse || form.adresse || '';
      form.contact = client.contact || form.contact || '';
    }
  }

  onFileSelectCategorie(event: any, form: any, categorie: string) {
    const files = event.target.files;
    if (!files) return;
    if (!form.documentsImportes) form.documentsImportes = [];
    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        form.documentsImportes.push({
          nom: file.name,
          type: categorie,
          taille: (file.size / 1024).toFixed(2),
          dateAjout: new Date().toLocaleString('fr-FR'),
          data: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  loadEmployes() {
    this.http.get<any[]>('http://localhost:8080/api/utilisateurs').subscribe({
      next: (data) => {
        this.employes = data;
        this.techniciens = data.filter((e: any) => e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP');
      },
      error: () => { this.employes = []; this.techniciens = []; }
    });
  }

  loadFiches() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => this.fiches = data.map(f => this.mapFromBackend(f)),
      error: () => this.fiches = []
    });
  }

  mapFromBackend(f: any): any {
    let techNoms: string[] = [];
    try { techNoms = f.technicienNoms ? JSON.parse(f.technicienNoms) : []; } catch { techNoms = []; }
    if (techNoms.length === 0 && f.technicien) {
      techNoms = [`${f.technicien.prenom} ${f.technicien.nom}`];
    }
    const techIds: number[] = f.technicienIds
      ? f.technicienIds.split(',').map(Number).filter(Boolean)
      : (f.technicien ? [f.technicien.id] : []);
    return {
      id: f.id,
      numProjet: f.numProjet,
      client: f.client,
      dateIntervention: f.dateIntervention,
      date: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
      dateDebut: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
      dateFin: f.dateFin ? f.dateFin.split('T')[0] : '',
      technicienAssigne: techNoms.join(', '),
      selectedTechIds: techIds,
      technicienId: f.technicien?.id || null,
      description: f.description,
      adresse: f.adresse,
      contact: f.contact,
      statut: f.statut,
      heureDebut: f.heureDebut,
      heureFin: f.heureFin,
      materielsHorsStandard: f.materielsHorsStandard ? JSON.parse(f.materielsHorsStandard) : [],
      documentsImportes: f.documentsImportes ? JSON.parse(f.documentsImportes) : [],
      taches: f.taches ? JSON.parse(f.taches) : [],
      nouvelleTacheManuelle: ''
    };
  }

  isTechSelected(selectedIds: any[], techId: number): boolean {
    return (selectedIds || []).map(Number).includes(Number(techId));
  }

  toggleTech(selectedIds: any[], techId: number, event: any) {
    const ids = (selectedIds || []).map(Number);
    if (event.target.checked) {
      if (!ids.includes(Number(techId))) ids.push(Number(techId));
    } else {
      const i = ids.indexOf(Number(techId));
      if (i !== -1) ids.splice(i, 1);
    }
    selectedIds.length = 0;
    ids.forEach(id => selectedIds.push(id));
  }

  getTechColor(techId: number): string {
    const colors = ['#1565c0', '#6a1b9a', '#2e7d32', '#e65100', '#00695c', '#c62828'];
    return colors[Number(techId) % colors.length];
  }

  buildTechBody(selectedTechIds: any[]) {
    const ids = selectedTechIds.map(Number).filter(Boolean);
    const techs = this.techniciens.filter((t: any) => ids.includes(Number(t.id)));
    return {
      technicien: techs[0] ? { id: techs[0].id } : null,
      technicienIds: techs.map((t: any) => t.id).join(','),
      technicienNoms: JSON.stringify(techs.map((t: any) => `${t.prenom} ${t.nom}`))
    };
  }

  formatDate(date: any): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  afficherDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  ajouterFiche() {
    if (!this.nouvelleFiche.numProjet || !this.nouvelleFiche.client) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const techBody = this.buildTechBody(this.nouvelleFiche.selectedTechIds || []);
    const body = {
      numProjet: this.nouvelleFiche.numProjet,
      client: this.nouvelleFiche.client,
      adresse: this.nouvelleFiche.adresse,
      contact: this.nouvelleFiche.contact,
      dateIntervention: this.formatDate(this.nouvelleFiche.dateDebut),
      dateFin: this.formatDate(this.nouvelleFiche.dateFin),
      description: this.nouvelleFiche.description,
      taches: JSON.stringify(this.nouvelleFiche.taches || []),
      documentsImportes: JSON.stringify(this.nouvelleFiche.documentsImportes || []),
      statut: 'EN_COURS',
      manager: { id: this.currentUser.id },
      ...techBody
    };
    this.http.post<any>(API, body).subscribe({
      next: (fiche) => {
        const ficheData = this.mapFromBackend(fiche);
        ficheData.dateDebut = this.nouvelleFiche.dateDebut;
        ficheData.dateFin = this.nouvelleFiche.dateFin;
        ficheData.selectedTechIds = this.nouvelleFiche.selectedTechIds || [];
        ficheData.client = this.nouvelleFiche.client;
        this.fiches.push(ficheData);
        alert('Fiche creee et envoyee au technicien !');
        this.resetFormAdd();
        this.showFormAdd = false;
      },
      error: () => alert('Erreur creation fiche')
    });
  }

  ouvrirEdition(fiche: any) {
    this.ficheEnEdition = JSON.parse(JSON.stringify(fiche));
    if (this.ficheEnEdition.date) {
      this.ficheEnEdition.date = this.ficheEnEdition.date.toString().split('T')[0];
    }
    if (!this.ficheEnEdition.nouvelleTacheManuelle) this.ficheEnEdition.nouvelleTacheManuelle = '';
    this.showFormEdit = true;
    this.showFormAdd = false;
  }

  modifierFiche() {
    if (!this.ficheEnEdition.numProjet) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    const techBody = this.buildTechBody(this.ficheEnEdition.selectedTechIds || []);
    const body = {
      numProjet: this.ficheEnEdition.numProjet,
      client: this.ficheEnEdition.client,
      adresse: this.ficheEnEdition.adresse,
      contact: this.ficheEnEdition.contact,
      dateIntervention: this.formatDate(this.ficheEnEdition.dateDebut || this.ficheEnEdition.date),
      dateFin: this.formatDate(this.ficheEnEdition.dateFin),
      description: this.ficheEnEdition.description,
      taches: JSON.stringify(this.ficheEnEdition.taches || []),
      documentsImportes: JSON.stringify(this.ficheEnEdition.documentsImportes || []),
      statut: this.ficheEnEdition.statut,
      ...techBody
    };
    this.http.put<any>(`${API}/${this.ficheEnEdition.id}`, body).subscribe({
      next: (fiche) => {
        const index = this.fiches.findIndex((f: any) => f.id === this.ficheEnEdition.id);
        if (index !== -1) {
          const ficheData = this.mapFromBackend(fiche);
          ficheData.dateDebut = this.ficheEnEdition.dateDebut || ficheData.dateDebut;
          ficheData.dateFin = this.ficheEnEdition.dateFin || '';
          this.fiches[index] = ficheData;
        }
        this.showFormEdit = false;
        this.ficheEnEdition = null;
      },
      error: () => alert('Erreur modification')
    });
  }

  supprimerFiche(id: number) {
    if (confirm('Supprimer cette fiche ?')) {
      this.http.delete(`${API}/${id}`).subscribe({
        next: () => { this.fiches = this.fiches.filter((f: any) => f.id !== id); },
        error: () => alert('Erreur suppression')
      });
    }
  }

  resetFormAdd() {
    this.nouvelleFiche = {
      numProjet: '', client: '', dateDebut: '', dateFin: '',
      technicienAssigne: '', selectedTechIds: [] as number[],
      description: '', codeClient: '', numCommande: '', chiffreAffaire: 0,
      adresse: '', contact: '', materielsHorsStandard: [],
      nouveauMateriel: '', documentsImportes: [], taches: [],
      nouvelleTacheManuelle: ''
    };
  }

  getDuree(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    if (d2 < d1) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  resetFormEdit() { this.ficheEnEdition = null; this.showFormEdit = false; }

  ajouterMateriel(form: any) {
    if (form.nouveauMateriel?.trim()) {
      if (!form.materielsHorsStandard) form.materielsHorsStandard = [];
      form.materielsHorsStandard.push(form.nouveauMateriel.trim());
      form.nouveauMateriel = '';
    }
  }

  supprimerMateriel(form: any, index: number) { form.materielsHorsStandard.splice(index, 1); }

  onFileSelectDocuments(event: any, form: any) {
    const files = event.target.files;
    if (files) {
      for (const file of Array.from(files) as File[]) {
        form.documentsImportes.push({
          nom: file.name.replace(/\.[^/.]+$/, ''),
          type: 'file',
          taille: (file.size / 1024).toFixed(2),
          dateAjout: new Date().toLocaleString('fr-FR')
        });
      }
    }
  }

  supprimerDocument(form: any, index: number) { form.documentsImportes.splice(index, 1); }

  ouvrirDocument(doc: any) {
    if (!doc.data) { alert('Contenu du fichier non disponible'); return; }
    const a = document.createElement('a');
    a.href = doc.data;
    a.download = doc.nom;
    a.target = '_blank';
    a.click();
  }

  ajouterTache(form: any, tache: string) {
    if (!form.taches) form.taches = [];
    if (!form.taches.some((t: any) => t.nom === tache)) {
      form.taches.push({ nom: tache, coche: false, selections: [], customOptions: [], autreTemp: '' });
    }
  }

  ajouterTacheManuelle(form: any) {
    const nom = form.nouvelleTacheManuelle?.trim();
    if (!nom) return;
    if (!form.taches) form.taches = [];
    if (!form.taches.some((t: any) => t.nom === nom)) {
      form.taches.push({ nom: nom, coche: false, selections: [], customOptions: [], autreTemp: '' });
    }
    form.nouvelleTacheManuelle = '';
  }

  supprimerTache(form: any, index: number) { form.taches.splice(index, 1); }

  getOptionsTache(nomTache: string): string[] { return this.optionsTaches[nomTache] || []; }

  getAllOptions(tache: any): string[] {
    const predefined = this.optionsTaches[tache.nom] || [];
    const custom = tache.customOptions || [];
    return [...predefined, ...custom];
  }

  isSelected(tache: any, option: string): boolean {
    return tache.selections?.includes(option) || false;
  }

  toggleSelection(tache: any, option: string) {
    if (!tache.selections) tache.selections = [];
    const idx = tache.selections.indexOf(option);
    if (idx === -1) tache.selections.push(option);
    else tache.selections.splice(idx, 1);
  }

  ajouterAutre(tache: any) {
    const val = tache.autreTemp?.trim();
    if (!val) return;
    if (!tache.customOptions) tache.customOptions = [];
    if (!tache.selections) tache.selections = [];
    if (!tache.customOptions.includes(val)) tache.customOptions.push(val);
    if (!tache.selections.includes(val)) tache.selections.push(val);
    tache.autreTemp = '';
  }

  tacheExiste(form: any, nomTache: string): boolean {
    return form.taches?.some((t: any) => t.nom === nomTache) || false;
  }
}