import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  CategoriesTachesApi, ClientsApi, FichesInterventionApi, TachesApi, UtilisateursApi
} from '../../services/api/apis';

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
  @Input() modeConsultation = false;
  /** Filtre statut appliqué à l'ouverture (ex. clic sur le graphique du dashboard). */
  @Input() statutInitial = '';
  /** Filtre période appliqué à l'ouverture (clic sur une barre du graphique Interventions).
   * debut/fin au format AAAA-MM-JJ, inclus. */
  @Input() periodeInitiale: { debut: string; fin: string; libelle: string } | null = null;
  filtrePeriode: { debut: string; fin: string; libelle: string } | null = null;
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
    if (this.filtrePeriode) {
      const { debut, fin } = this.filtrePeriode;
      // Même date de référence que le graphique du dashboard
      liste = liste.filter((f: any) => {
        const d = String(f.dateIntervention || f.dateCreation || '').slice(0, 10);
        return d >= debut && d <= fin;
      });
    }
    if (this.filtreStatut) {
      liste = liste.filter((f: any) => f.statut === this.filtreStatut);
    } else if (!this.filtrePeriode) {
      // Par défaut, les fiches complétées ne s'affichent pas ici — elles ont
      // leur propre page "Fiches Complétées". Il faut choisir explicitement
      // le filtre "Complétée" pour les voir dans cette liste.
      // (Avec un filtre période, tous les statuts sont affichés — comme dans le graphique.)
      liste = liste.filter((f: any) => f.statut !== 'COMPLETEE');
    }
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

  optionsTaches: any = {};
  tachesDisponibles: string[] = [];

  // ── PROJETS LIÉS ──
  projets: any[] = [];

  loadProjets() {
    this.tachesApi.lister<any>().subscribe({
      next: (data) => this.projets = data.filter((p: any) => p.titre),
      error: () => this.projets = []
    });
  }

  loadCategoriesTaches() {
    this.categoriesTachesApi.lister<any>().subscribe({
      next: (categories) => {
        this.tachesDisponibles = categories.map((c: any) => c.nom);
        this.optionsTaches = {};
        categories.forEach((c: any) => {
          this.optionsTaches[c.nom] = (c.options || []).map((o: any) => o.nom);
        });
      },
      error: () => { this.tachesDisponibles = []; this.optionsTaches = {}; }
    });
  }

  formAjoutInvalide = false;
  formEditInvalide = false;

  nouvelleFiche: any = {
    numProjet: '', client: '', dateDebut: '', dateFin: '',
    technicienAssigne: '', selectedTechIds: [] as number[],
    description: '', codeClient: '', numCommande: '', chiffreAffaire: 0,
    adresse: '', contact: '', nomContactSite: '', telContactSite: '',
    numeroFacture: '', dateFacturation: '', montantFacture: '', refSage: '',
    materielsHorsStandard: [], nouveauMateriel: '', documentsImportes: [], taches: []
  };

  constructor(
    private fichesApi: FichesInterventionApi,
    private clientsApi: ClientsApi,
    private tachesApi: TachesApi,
    private categoriesTachesApi: CategoriesTachesApi,
    private utilisateursApi: UtilisateursApi
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.statutInitial) this.filtreStatut = this.statutInitial;
    if (this.periodeInitiale) this.filtrePeriode = this.periodeInitiale;
    this.loadEmployes();
    this.loadFiches();
    this.loadClients();
    this.loadCategoriesTaches();
    this.loadProjets();
  }

  loadClients() {
    this.clientsApi.lister<any>().subscribe({
      next: (data) => this.clients = data,
      error: () => this.clients = []
    });
  }

  ajouterClientLocal() {
    if (!this.nouveauClient.nom.trim()) { alert('Le nom du client est obligatoire'); return; }
    const client = { ...this.nouveauClient };
    this.clientsApi.creer<any>(client).subscribe({
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
      this.clientsApi.supprimer(id).subscribe({
        next: () => this.loadClients(),
        error: () => alert('Erreur lors de la suppression')
      });
    }
  }

  onClientChange(clientNom: any, form: any) {
    const client = this.clients.find((c: any) => c.nom === clientNom);
    if (client) {
      form.client = client.nom;
      // L'adresse du site d'intervention n'est pas forcément celle du client
      // (siège, facturation…) — elle reste un champ saisi manuellement.
      form.contact = client.contact || form.contact || '';
    }
    // Le projet déjà choisi n'a plus de sens si son client ne correspond
    // plus au client nouvellement sélectionné.
    if (form.numProjet) {
      const projetActuel = this.projets.find((p: any) => p.titre === form.numProjet);
      if (projetActuel && projetActuel.client !== form.client) {
        form.numProjet = '';
      }
    }
    this.afficherInfosProjet(form);
  }

  // ── COMBOBOX PROJET (ajout + édition) : filtré par client + saisie libre ──
  projetDropdownCible: 'add' | 'edit' | null = null;
  private projetRechercheEnCours = false;

  ouvrirProjetDropdown(cible: 'add' | 'edit') {
    this.projetDropdownCible = cible;
    this.projetRechercheEnCours = false;
  }

  onSaisieProjet(cible: 'add' | 'edit', valeur: string) {
    this.projetRechercheEnCours = true;
    const form = cible === 'add' ? this.nouvelleFiche : this.ficheEnEdition;
    form.numProjet = valeur;
    this.afficherInfosProjet(form);
  }

  fermerProjetDropdown() {
    this.projetDropdownCible = null;
  }

  fermerProjetDropdownDelai() {
    setTimeout(() => this.fermerProjetDropdown(), 150);
  }

  /** Projets du client sélectionné sur le formulaire ciblé — tous les projets
   * si aucun client n'y est choisi. */
  projetsDuClient(cible: 'add' | 'edit'): any[] {
    const form = cible === 'add' ? this.nouvelleFiche : this.ficheEnEdition;
    return form.client
      ? this.projets.filter((p: any) => p.client === form.client)
      : this.projets;
  }

  projetsPourDropdown(cible: 'add' | 'edit'): any[] {
    const base = this.projetsDuClient(cible);
    if (!this.projetRechercheEnCours) return base;
    const form = cible === 'add' ? this.nouvelleFiche : this.ficheEnEdition;
    const q = (form.numProjet || '').toLowerCase().trim();
    if (!q) return base;
    return base.filter((p: any) => (p.titre || '').toLowerCase().includes(q));
  }

  selectionnerProjet(cible: 'add' | 'edit', titre: string) {
    const form = cible === 'add' ? this.nouvelleFiche : this.ficheEnEdition;
    form.numProjet = titre;
    const projet = this.projets.find((p: any) => p.titre === titre);
    if (projet) this.remplirDepuisProjet(projet, form);
    this.afficherInfosProjet(form);
    this.fermerProjetDropdown();
  }

  /** Pré-remplit les infos client à partir de la fiche projet (et du client qui
   * y est rattaché). Seules les valeurs renseignées écrasent le formulaire ;
   * les champs restent modifiables. */
  private remplirDepuisProjet(projet: any, form: any) {
    if (projet.client) form.client = projet.client;
    if (projet.adresse) form.adresse = projet.adresse;
    const client = this.clients.find((c: any) => c.nom === projet.client);
    if (client?.contact) form.contact = client.contact;
  }

  /** Code Client, N° Commande et Montant : affichage seul, non enregistrés sur
   * la fiche — toujours recalculés depuis le client et le projet sélectionnés. */
  private afficherInfosProjet(form: any) {
    const client = this.clients.find((c: any) => c.nom === form.client);
    form.codeClient = client?.codeClient || '';
    const projet = this.projets.find((p: any) => p.titre === form.numProjet);
    // Côté projet, le N° Commande est stocké dans "description" (cf. taches.ts)
    form.numCommande = projet?.description || '';
    const montant = parseFloat(projet?.chiffreAffaire);
    form.chiffreAffaire = isNaN(montant)
      ? ''
      : montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  toggleFormAdd() {
    this.showFormAdd = !this.showFormAdd;
    this.showFormEdit = false;
    if (this.showFormAdd) { this.loadEmployes(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadEmployes() {
    this.utilisateursApi.lister<any>().subscribe({
      next: (data) => {
        this.employes = data;
        this.techniciens = data.filter((e: any) => e.role === 'TECHNICIEN' || e.role === 'TECHNICIEN_SUP');
      },
      error: () => { this.employes = []; this.techniciens = []; }
    });
  }

  loadFiches() {
    this.fichesApi.lister<any>().subscribe({
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
      dateCreation: f.dateCreation,
      date: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
      dateDebut: f.dateIntervention ? f.dateIntervention.split('T')[0] : '',
      dateFin: f.dateFin ? f.dateFin.split('T')[0] : '',
      technicienAssigne: techNoms.join(', '),
      selectedTechIds: techIds,
      technicienId: f.technicien?.id || null,
      description: f.description,
      adresse: f.adresse,
      contact: f.contact,
      nomContactSite: f.nomContactSite || '',
      numeroFacture: f.numeroFacture || '',
      dateFacturation: f.dateFacturation || '',
      montantFacture: f.montantFacture || '',
      refSage: f.refSage || '',
      telContactSite: f.telContactSite || '',
      statut: f.statut,
      heureDebut: f.heureDebut,
      heureFin: f.heureFin,
      materielsHorsStandard: f.materielsHorsStandard ? JSON.parse(f.materielsHorsStandard) : [],
      documentsImportes: f.documentsImportes ? JSON.parse(f.documentsImportes) : [],
      taches: f.taches ? JSON.parse(f.taches) : []
    };
  }

  techDropdownNouvelleOpen = false;
  techDropdownEditionOpen = false;

  @HostListener('document:click')
  fermerDropdownsTech() {
    this.techDropdownNouvelleOpen = false;
    this.techDropdownEditionOpen = false;
  }

  isTechSelected(selectedIds: any[], techId: number): boolean {
    return (selectedIds || []).map(Number).includes(Number(techId));
  }

  getSelectedTechLabel(selectedIds: any[]): string {
    const ids = (selectedIds || []).map(Number);
    const techs = this.techniciens.filter((t: any) => ids.includes(Number(t.id)));
    if (techs.length === 0) return 'Sélectionner technicien(s)...';
    if (techs.length === 1) return `${techs[0].prenom} ${techs[0].nom}`;
    return `${techs.length} techniciens sélectionnés`;
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

  getConflitTech(techId: number, form: any): any {
    const debut = form?.dateDebut || form?.date;
    if (!debut) return null;
    const fin = form?.dateFin || debut;
    const excludeId = form?.id || null;
    return this.fiches.find((f: any) => {
      if (excludeId && f.id === excludeId) return false;
      if (!this.isTechSelected(f.selectedTechIds, techId)) return false;
      const fDebut = f.dateDebut || f.date;
      if (!fDebut) return false;
      const fFin = f.dateFin || fDebut;
      return debut <= fFin && fDebut <= fin;
    }) || null;
  }

  getConflitLabel(techId: number, form: any): string {
    const c = this.getConflitTech(techId, form);
    if (!c) return '';
    const periode = c.dateFin && c.dateFin !== c.dateDebut
      ? `${this.afficherDate(c.dateDebut)} → ${this.afficherDate(c.dateFin)}`
      : this.afficherDate(c.dateDebut);
    return `Déjà occupé ${periode} — ${c.client || 'autre intervention'}`;
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
      this.formAjoutInvalide = true;
      alert('Veuillez remplir les champs obligatoires');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.formAjoutInvalide = false;
    if (this.nouvelleFiche.dateDebut && this.nouvelleFiche.dateFin && this.nouvelleFiche.dateFin < this.nouvelleFiche.dateDebut) {
      alert('La date de fin ne peut pas être avant la date de début.');
      return;
    }
    const techBody = this.buildTechBody(this.nouvelleFiche.selectedTechIds || []);
    const body = {
      numProjet: this.nouvelleFiche.numProjet,
      client: this.nouvelleFiche.client,
      adresse: this.nouvelleFiche.adresse,
      contact: this.nouvelleFiche.contact,
      nomContactSite: this.nouvelleFiche.nomContactSite,
      telContactSite: this.nouvelleFiche.telContactSite,
      numeroFacture: this.nouvelleFiche.numeroFacture || null,
      dateFacturation: this.nouvelleFiche.dateFacturation || null,
      montantFacture: this.nouvelleFiche.montantFacture != null && this.nouvelleFiche.montantFacture !== '' ? String(this.nouvelleFiche.montantFacture) : null,
      refSage: this.nouvelleFiche.refSage || null,
      dateIntervention: this.formatDate(this.nouvelleFiche.dateDebut),
      dateFin: this.formatDate(this.nouvelleFiche.dateFin),
      description: this.nouvelleFiche.description,
      taches: JSON.stringify(this.nouvelleFiche.taches || []),
      materielsHorsStandard: JSON.stringify(this.nouvelleFiche.materielsHorsStandard || []),
      documentsImportes: JSON.stringify(this.nouvelleFiche.documentsImportes || []),
      statut: 'EN_COURS',
      manager: { id: this.currentUser.id },
      ...techBody
    };
    this.fichesApi.creer<any>(body).subscribe({
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
    this.afficherInfosProjet(this.ficheEnEdition);
    this.showFormEdit = true;
    this.showFormAdd = false;
  }

  modifierFiche() {
    if (!this.ficheEnEdition.numProjet) {
      this.formEditInvalide = true;
      alert('Veuillez remplir les champs obligatoires');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.formEditInvalide = false;
    if (this.ficheEnEdition.dateDebut && this.ficheEnEdition.dateFin && this.ficheEnEdition.dateFin < this.ficheEnEdition.dateDebut) {
      alert('La date de fin ne peut pas être avant la date de début.');
      return;
    }
    const techBody = this.buildTechBody(this.ficheEnEdition.selectedTechIds || []);
    const body = {
      numProjet: this.ficheEnEdition.numProjet,
      client: this.ficheEnEdition.client,
      adresse: this.ficheEnEdition.adresse,
      contact: this.ficheEnEdition.contact,
      nomContactSite: this.ficheEnEdition.nomContactSite,
      telContactSite: this.ficheEnEdition.telContactSite,
      numeroFacture: this.ficheEnEdition.numeroFacture || null,
      dateFacturation: this.ficheEnEdition.dateFacturation || null,
      montantFacture: this.ficheEnEdition.montantFacture != null && this.ficheEnEdition.montantFacture !== '' ? String(this.ficheEnEdition.montantFacture) : null,
      refSage: this.ficheEnEdition.refSage || null,
      dateIntervention: this.formatDate(this.ficheEnEdition.dateDebut || this.ficheEnEdition.date),
      dateFin: this.formatDate(this.ficheEnEdition.dateFin),
      description: this.ficheEnEdition.description,
      taches: JSON.stringify(this.ficheEnEdition.taches || []),
      materielsHorsStandard: JSON.stringify(this.ficheEnEdition.materielsHorsStandard || []),
      documentsImportes: JSON.stringify(this.ficheEnEdition.documentsImportes || []),
      statut: this.ficheEnEdition.statut,
      ...techBody
    };
    this.fichesApi.modifier<any>(this.ficheEnEdition.id, body).subscribe({
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => alert('Erreur modification')
    });
  }

  supprimerFiche(id: number) {
    if (confirm('Supprimer cette fiche ?')) {
      this.fichesApi.supprimer(id).subscribe({
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
      adresse: '', contact: '', nomContactSite: '', telContactSite: '',
      numeroFacture: '', dateFacturation: '', montantFacture: '', refSage: '',
      materielsHorsStandard: [],
      nouveauMateriel: '', documentsImportes: [], taches: []
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getDuree(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    if (d2 < d1) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  resetFormEdit() {
    this.ficheEnEdition = null;
    this.showFormEdit = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  // ── Rubrique Facturation : les factures sont des documents de type "Facture",
  // affichées dans leur rubrique et non dans « Documents / Fichiers ». ──
  static readonly TYPE_FACTURE = 'Facture';
  facturesDe(form: any): any[] {
    return (form?.documentsImportes || []).filter((d: any) => d.type === FicheInterventionManager.TYPE_FACTURE);
  }
  documentsHorsFactures(form: any): any[] {
    return (form?.documentsImportes || []).filter((d: any) => d.type !== FicheInterventionManager.TYPE_FACTURE);
  }
  /** Suppression par référence (les listes affichées sont filtrées, l'index ne correspond plus). */
  supprimerDocumentObjet(form: any, doc: any) {
    form.documentsImportes = (form.documentsImportes || []).filter((d: any) => d !== doc);
  }

  ouvrirDocument(doc: any) {
    if (!doc.data) { alert('Contenu du fichier non disponible'); return; }
    const a = document.createElement('a');
    a.href = doc.data;
    a.download = doc.nom;
    a.target = '_blank';
    a.click();
  }

  // ── Aperçu d'un document importé (images, PDF, texte) ──
  private readonly sanitizer = inject(DomSanitizer);
  apercuDoc: { doc: any; genre: 'image' | 'pdf' | 'texte' | 'autre'; url: SafeResourceUrl | null; texte: string } | null = null;
  private apercuBlobUrl: string | null = null;

  visualiserDocument(doc: any) {
    if (!doc.data) { alert('Contenu du fichier non disponible'); return; }
    this.fermerApercu();
    // doc.data est une data URL (data:<mime>;base64,<contenu>) produite à l'import
    const [entete, base64 = ''] = String(doc.data).split(',');
    const nom = (doc.nom || '').toLowerCase();
    let mime = (entete.match(/^data:([^;]+)/) || [])[1] || '';
    if (!mime || mime === 'application/octet-stream') {
      if (/\.pdf$/.test(nom)) mime = 'application/pdf';
      else if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(nom)) mime = 'image/' + nom.split('.').pop()!.replace('jpg', 'jpeg').replace('svg', 'svg+xml');
      else if (/\.(txt|csv|log|json|xml)$/.test(nom)) mime = 'text/plain';
    }
    const genre = mime.startsWith('image/') ? 'image' : mime === 'application/pdf' ? 'pdf' : mime.startsWith('text/') ? 'texte' : 'autre';

    let url: SafeResourceUrl | null = null;
    let texte = '';
    try {
      const octets = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      if (genre === 'texte') {
        texte = new TextDecoder('utf-8').decode(octets);
      } else if (genre !== 'autre') {
        // URL blob (les navigateurs bloquent l'affichage direct des data URL dans une iframe)
        this.apercuBlobUrl = URL.createObjectURL(new Blob([octets], { type: mime }));
        url = this.sanitizer.bypassSecurityTrustResourceUrl(this.apercuBlobUrl);
      }
    } catch {
      alert('Impossible de lire ce fichier.');
      return;
    }
    this.apercuDoc = { doc, genre, url, texte };
  }

  fermerApercu() {
    if (this.apercuBlobUrl) URL.revokeObjectURL(this.apercuBlobUrl);
    this.apercuBlobUrl = null;
    this.apercuDoc = null;
  }

  ajouterTache(form: any, tache: string) {
    if (!form.taches) form.taches = [];
    if (!form.taches.some((t: any) => t.nom === tache)) {
      form.taches.push({ nom: tache, coche: false, selections: [], customOptions: [] });
    }
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

  estOptionPersonnalisee(tache: any, option: string): boolean {
    return tache.customOptions?.includes(option) || false;
  }

  /** Retire une sous-tâche créée pour cette intervention (les sous-tâches
   * prédéfinies par l'admin, elles, ne se suppriment pas d'ici). */
  supprimerOptionPersonnalisee(tache: any, option: string) {
    if (tache.customOptions) {
      const idx = tache.customOptions.indexOf(option);
      if (idx !== -1) tache.customOptions.splice(idx, 1);
    }
    if (tache.selections) {
      const idx = tache.selections.indexOf(option);
      if (idx !== -1) tache.selections.splice(idx, 1);
    }
  }

  /** Crée une sous-tâche propre à cette intervention (en plus des sous-tâches
   * prédéfinies par l'admin) et la sélectionne automatiquement. */
  ajouterOptionPersonnalisee(tache: any) {
    const val = (tache.nouvelleOption || '').trim();
    if (!val) return;
    if (!tache.customOptions) tache.customOptions = [];
    if (!this.getAllOptions(tache).includes(val)) {
      tache.customOptions.push(val);
    }
    if (!tache.selections) tache.selections = [];
    if (!tache.selections.includes(val)) tache.selections.push(val);
    tache.nouvelleOption = '';
  }

  tacheExiste(form: any, nomTache: string): boolean {
    return form.taches?.some((t: any) => t.nom === nomTache) || false;
  }
}