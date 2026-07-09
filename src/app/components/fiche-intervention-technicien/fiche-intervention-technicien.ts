import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const API = 'http://localhost:8080/api/fiches-intervention';

@Component({
  selector: 'app-fiche-intervention-technicien',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './fiche-intervention-technicien.html',
  styleUrl: './fiche-intervention-technicien.css'
})
export class FicheInterventionTechnicien implements OnInit {
  intervention: any = {};
  technicienId: number = 0;
  photos: any[] = [];
  materielsHorsStandard: string[] = [];
  nouveauMateriel: string = '';

  @ViewChild('signatureTechnicien') signatureTechnicienCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signatureClient') signatureClientCanvas!: ElementRef<HTMLCanvasElement>;

  isDrawingTech = false;
  isDrawingClient = false;
  signatureTechnicienData: string = '';
  signatureClientData: string = '';

  form = {
    dateDebut: '', intervenants: '',
    photos: [], signatureTechnicien: '', signatureClient: '',
    nomClientSigne: '', dateSignature: ''
  };

  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.technicienId = user.id;
    this.route.params.subscribe(params => {
      if (params['id']) { this.loadIntervention(parseInt(params['id'])); }
      else { this.loadPremiereFiche(); }
    });
  }

  loadIntervention(id: number) {
    this.http.get<any>(`${API}/${id}`).subscribe({
      next: (fiche) => {
        this.intervention = this.mapFromBackend(fiche);
        setTimeout(() => this.initSignatureCanvases(), 150);
      },
      error: () => this.intervention = {}
    });
  }

  loadPremiereFiche() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.http.get<any[]>(`${API}/technicien/${user.id}`).subscribe({
      next: (fiches) => {
        const fiche = fiches.find((f: any) => f.statut !== 'COMPLETEE');
        if (fiche) {
          this.intervention = this.mapFromBackend(fiche);
          setTimeout(() => this.initSignatureCanvases(), 150);
        }
      },
      error: () => this.intervention = {}
    });
  }

  mapFromBackend(f: any): any {
    return {
      id: f.id, numProjet: f.numProjet, client: f.client, adresse: f.adresse,
      contact: f.contact, nomContactSite: f.nomContactSite, telContactSite: f.telContactSite,
      dateIntervention: f.dateIntervention, dateFin: f.dateFin,
      description: f.description,
      statut: f.statut,
      technicienAssigne: f.technicien ? `${f.technicien.prenom} ${f.technicien.nom}` : '',
      technicienId: f.technicien?.id,
      taches: f.taches ? JSON.parse(f.taches) : [],
      documentsImportes: f.documentsImportes ? JSON.parse(f.documentsImportes) : []
    };
  }

  initSignatureCanvases() {
    this.setupSignatureCanvas(this.signatureTechnicienCanvas, 'tech');
    this.setupSignatureCanvas(this.signatureClientCanvas, 'client');
  }

  setupSignatureCanvas(canvasRef: ElementRef<HTMLCanvasElement>, type: string) {
    if (!canvasRef) return;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 400; canvas.height = 150;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);
    canvas.addEventListener('mousedown', (e) => this.startDrawing(e, type));
    canvas.addEventListener('mousemove', (e) => this.draw(e, type));
    canvas.addEventListener('mouseup', (e) => this.stopDrawing(e, type));
    canvas.addEventListener('mouseleave', (e) => this.stopDrawing(e, type));
    canvas.addEventListener('touchstart', (e) => this.startDrawingTouch(e, type));
    canvas.addEventListener('touchmove', (e) => this.drawTouch(e, type));
    canvas.addEventListener('touchend', (e) => this.stopDrawing(e, type));
  }

  startDrawing(event: MouseEvent, type: string) {
    type === 'tech' ? this.isDrawingTech = true : this.isDrawingClient = true;
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const ctx = canvasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = canvasRef.nativeElement.width / rect.width;
    const scaleY = canvasRef.nativeElement.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
  }

  startDrawingTouch(event: TouchEvent, type: string) {
    event.preventDefault();
    type === 'tech' ? this.isDrawingTech = true : this.isDrawingClient = true;
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const ctx = canvasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    const touch = event.touches[0];
    const rect = canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = canvasRef.nativeElement.width / rect.width;
    const scaleY = canvasRef.nativeElement.height / rect.height;
    ctx.beginPath();
    ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
  }

  draw(event: MouseEvent, type: string) {
    const isDrawing = type === 'tech' ? this.isDrawingTech : this.isDrawingClient;
    if (!isDrawing) return;
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = canvasRef.nativeElement.width / rect.width;
    const scaleY = canvasRef.nativeElement.height / rect.height;
    ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
    ctx.stroke();
  }

  drawTouch(event: TouchEvent, type: string) {
    event.preventDefault();
    const isDrawing = type === 'tech' ? this.isDrawingTech : this.isDrawingClient;
    if (!isDrawing) return;
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const touch = event.touches[0];
    const rect = canvasRef.nativeElement.getBoundingClientRect();
    const scaleX = canvasRef.nativeElement.width / rect.width;
    const scaleY = canvasRef.nativeElement.height / rect.height;
    ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    ctx.stroke();
  }

  stopDrawing(event: Event, type: string) {
    type === 'tech' ? this.isDrawingTech = false : this.isDrawingClient = false;
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const ctx = canvasRef.nativeElement.getContext('2d');
    if (ctx) ctx.beginPath();
  }

  effacerSignature(type: string) {
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, canvas.height);
    type === 'tech' ? this.signatureTechnicienData = '' : this.signatureClientData = '';
  }

  sauvegarderSignature(type: string) {
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const signature = canvasRef.nativeElement.toDataURL('image/png');
    if (type === 'tech') { this.signatureTechnicienData = signature; this.form.signatureTechnicien = signature; }
    else { this.signatureClientData = signature; this.form.signatureClient = signature; }
  }

  onPhotoSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => { this.photos.push({ nom: files[i].name, data: e.target.result }); };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  supprimerPhoto(index: number) { this.photos.splice(index, 1); }

  envoyerFiche() {
    if (!this.form.signatureTechnicien) { alert('Veuillez signer en tant que technicien'); return; }
    if (!this.form.signatureClient) { alert('Veuillez signer en tant que client'); return; }
    if (!this.form.nomClientSigne) { alert('Veuillez entrer le nom du client'); return; }

    const body = {
      intervenants: this.form.intervenants,
      signatureTechnicien: this.form.signatureTechnicien,
      signatureClient: this.form.signatureClient,
      nomClientSigne: this.form.nomClientSigne,
      dateCompletion: new Date().toISOString(),
      materielsHorsStandard: JSON.stringify(this.materielsHorsStandard),
      photos: JSON.stringify(this.photos)
    };

    this.http.put<any>(`${API}/${this.intervention.id}/completer`, body).subscribe({
      next: () => {
        alert('Fiche envoyee avec succes !');
        this.router.navigate(['/dashboard-technicien']);
      },
      error: () => alert('Erreur envoi fiche')
    });
  }

  sauvegarderProgres() {
    if (!this.intervention?.id) return;
    setTimeout(() => {
      const body = { taches: JSON.stringify(this.intervention.taches) };
      this.http.put(`${API}/${this.intervention.id}/taches`, body).subscribe();
    }, 50);
  }

  ajouterMateriel() {
    const val = this.nouveauMateriel.trim();
    if (val && !this.materielsHorsStandard.includes(val)) {
      this.materielsHorsStandard.push(val);
    }
    this.nouveauMateriel = '';
  }

  supprimerMateriel(index: number) { this.materielsHorsStandard.splice(index, 1); }

  annuler() { this.router.navigate(['/dashboard-technicien']); }
}