import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-fiche-intervention-technicien',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './fiche-intervention-technicien.html',
  styleUrl: './fiche-intervention-technicien.css'
})
export class FicheInterventionTechnicien implements OnInit {
  intervention: any = {};
  technicienId: number = 0;
  photos: any[] = [];

  @ViewChild('signatureTechnicien') signatureTechnicienCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signatureClient') signatureClientCanvas!: ElementRef<HTMLCanvasElement>;

  isDrawingTech = false;
  isDrawingClient = false;
  signatureTechnicienData: string = '';
  signatureClientData: string = '';

  form = {
    dateDebut: '',
    heureDebut: '',
    heureFin: '',
    intervenants: '',
    photos: [],
    signatureTechnicien: '',
    signatureClient: '',
    nomClientSigne: '',
    dateSignature: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.technicienId = user.id;

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadIntervention(parseInt(params['id']));
      } else {
        this.loadPremiereFiche();
      }
    });

    setTimeout(() => this.initSignatureCanvases(), 100);
  }

  loadIntervention(id: number) {
    const stored = localStorage.getItem('fiches_intervention');
    const fiches = stored ? JSON.parse(stored) : [];
    this.intervention = fiches.find((f: any) => f.id === id) || {};
  }

  loadPremiereFiche() {
    const stored = localStorage.getItem('fiches_intervention');
    const fiches = stored ? JSON.parse(stored) : [];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userFullName = `${user.prenom} ${user.nom}`;
    
    this.intervention = fiches.find((f: any) => f.technicienAssigne === userFullName) || {};
  }

  // ===== SIGNATURES =====
  initSignatureCanvases() {
    this.setupSignatureCanvas(this.signatureTechnicienCanvas, 'tech');
    this.setupSignatureCanvas(this.signatureClientCanvas, 'client');
  }

  setupSignatureCanvas(canvasRef: ElementRef<HTMLCanvasElement>, type: string) {
    if (!canvasRef) return;
    
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 150;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    canvas.addEventListener('mousedown', (e) => this.startDrawing(e, type));
    canvas.addEventListener('mousemove', (e) => this.draw(e, type));
    canvas.addEventListener('mouseup', (e) => this.stopDrawing(e, type));
    canvas.addEventListener('mouseleave', (e) => this.stopDrawing(e, type));

    canvas.addEventListener('touchstart', (e) => this.startDrawingTouch(e, type));
    canvas.addEventListener('touchmove', (e) => this.drawTouch(e, type));
    canvas.addEventListener('touchend', (e) => this.stopDrawing(e, type));
  }

  startDrawing(event: MouseEvent, type: string) {
    if (type === 'tech') {
      this.isDrawingTech = true;
    } else {
      this.isDrawingClient = true;
    }
  }

  startDrawingTouch(event: TouchEvent, type: string) {
    event.preventDefault();
    if (type === 'tech') {
      this.isDrawingTech = true;
    } else {
      this.isDrawingClient = true;
    }
  }

  draw(event: MouseEvent, type: string) {
    const isDrawing = type === 'tech' ? this.isDrawingTech : this.isDrawingClient;
    if (!isDrawing) return;

    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  drawTouch(event: TouchEvent, type: string) {
    event.preventDefault();
    const isDrawing = type === 'tech' ? this.isDrawingTech : this.isDrawingClient;
    if (!isDrawing) return;

    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  stopDrawing(event: Event, type: string) {
    if (type === 'tech') {
      this.isDrawingTech = false;
    } else {
      this.isDrawingClient = false;
    }

    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath();
  }

  effacerSignature(type: string) {
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (type === 'tech') {
      this.signatureTechnicienData = '';
    } else {
      this.signatureClientData = '';
    }
  }

  sauvegarderSignature(type: string) {
    const canvasRef = type === 'tech' ? this.signatureTechnicienCanvas : this.signatureClientCanvas;
    const canvas = canvasRef.nativeElement;
    const signature = canvas.toDataURL('image/png');

    if (type === 'tech') {
      this.signatureTechnicienData = signature;
      this.form.signatureTechnicien = signature;
    } else {
      this.signatureClientData = signature;
      this.form.signatureClient = signature;
    }
  }

  // ===== PHOTOS =====
  onPhotoSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photos.push({
            nom: files[i].name,
            data: e.target.result
          });
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  supprimerPhoto(index: number) {
    this.photos.splice(index, 1);
  }

  // ===== ENVOYER LA FICHE =====
  envoyerFiche() {
    if (!this.form.signatureTechnicien) {
      alert('❌ Veuillez signer en tant que technicien');
      return;
    }

    if (!this.form.signatureClient) {
      alert('❌ Veuillez signer en tant que client');
      return;
    }

    if (!this.form.nomClientSigne) {
      alert('❌ Veuillez entrer le nom du client');
      return;
    }

    const ficheCompletee = {
      ...this.intervention,
      ...this.form,
      statut: 'COMPLETEE',
      dateCompletion: new Date().toISOString()
    };

    const stored = localStorage.getItem('fiches_intervention');
    const fiches = stored ? JSON.parse(stored) : [];
    const index = fiches.findIndex((f: any) => f.id === this.intervention.id);
    
    if (index !== -1) {
      fiches[index] = ficheCompletee;
      localStorage.setItem('fiches_intervention', JSON.stringify(fiches));
      alert('✅ Fiche envoyée avec succès avec signatures !');
      this.router.navigate(['/dashboard-technicien']);
    }
  }

  annuler() {
    this.router.navigate(['/dashboard-technicien']);
  }
}