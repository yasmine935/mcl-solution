import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './employes.html',
  styleUrl: './employes.css'
})
export class Employes implements OnInit {
  employes: any[] = [];
  showForm = false;
  isEdit = false;
  
  employe = {
    id: null,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    username: '',
    password: '',
    role: 'EMPLOYE',
    statut: 'ACTIF'
  };

  displayedColumns = ['nom', 'prenom', 'email', 'poste', 'departement', 'role', 'statut', 'actions'];
  private apiUrl = 'http://localhost:8080/api/utilisateurs';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadEmployes();
  }

  loadEmployes() {
    this.http.get<any[]>(this.apiUrl).subscribe(data => {
      this.employes = data;
    });
  }

  openForm() {
    this.showForm = true;
    this.isEdit = false;
    this.resetForm();
  }

  editEmploye(e: any) {
    this.showForm = true;
    this.isEdit = true;
    this.employe = { ...e };
  }

  saveEmploye() {
    if (this.isEdit) {
      this.http.put(`${this.apiUrl}/${this.employe.id}`, this.employe).subscribe(() => {
        this.loadEmployes();
        this.showForm = false;
      });
    } else {
      this.http.post(this.apiUrl, this.employe).subscribe(() => {
        this.loadEmployes();
        this.showForm = false;
      });
    }
  }

  deleteEmploye(id: number) {
    if (confirm('Supprimer cet employé ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.loadEmployes();
      });
    }
  }

  resetForm() {
    this.employe = {
      id: null, nom: '', prenom: '', email: '',
      telephone: '', poste: '', departement: '',
      username: '', password: '', role: 'EMPLOYE', statut: 'ACTIF'
    };
  }

  cancel() {
    this.showForm = false;
    this.resetForm();
  }
}