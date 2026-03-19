import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

 login() {
  this.http.post<any>('http://localhost:8080/api/auth/login', {
    username: this.username,
    password: this.password
  }).subscribe({
    next: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      switch(user.role) {
  case 'TECHNICIEN':
    this.router.navigate(['/dashboard-technicien']);
    break;
  case 'TECHNICIEN_SUP':
    this.router.navigate(['/dashboard-kia']);
    break;
  case 'AURELIEN':
    this.router.navigate(['/dashboard-aurelien']);
    break;
  case 'ODILE':
    this.router.navigate(['/dashboard-odile']);
    break;
  case 'FERID':
    this.router.navigate(['/dashboard-admin']);
    break;
  case 'ESSAN':
    this.router.navigate(['/dashboard-essan']);
    break;
  default:
    this.router.navigate(['/login']);
}
    },
    error: () => {
      this.errorMessage = 'Username ou mot de passe incorrect !';
    }
  });
}
}