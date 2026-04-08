import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const API = 'http://localhost:8080/api/factures';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="factures-container">
      <h3>🧾 Factures & Comptabilité</h3>
      <div class="filters">
        <button [class.active]="filterStatus === 'EN_ATTENTE'" (click)="filterStatus = 'EN_ATTENTE'" class="filter-btn">
          En attente ({{ getCountByStatus('EN_ATTENTE') }})
        </button>
        <button [class.active]="filterStatus === 'PAYEE'" (click)="filterStatus = 'PAYEE'" class="filter-btn">
          Payées ({{ getCountByStatus('PAYEE') }})
        </button>
      </div>
      @if (facturesFiltrees.length === 0) {
        <p class="empty">Aucune facture à afficher</p>
      } @else {
        <div class="table-wrapper">
          <table class="factures-table">
            <thead>
              <tr>
                <th>Numéro</th><th>Client</th><th>Montant HT</th>
                <th>Date</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (facture of facturesFiltrees; track facture.id) {
                <tr [class.payee]="facture.statut === 'PAYEE'">
                  <td><strong>{{ facture.numero }}</strong></td>
                  <td>{{ facture.client }}</td>
                  <td style="color: #4CAF50; font-weight: 700;">{{ facture.montantHT }}€</td>
                  <td>{{ facture.dateFacture }}</td>
                  <td>
                    <span class="badge" [class.en_attente]="facture.statut === 'EN_ATTENTE'" [class.payee]="facture.statut === 'PAYEE'">
                      {{ facture.statut }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      @if (facture.statut === 'EN_ATTENTE') {
                        <button mat-icon-button color="primary" (click)="marquerPayee(facture)">
                          <mat-icon>check_circle</mat-icon>
                        </button>
                      }
                      <button mat-icon-button color="warn" (click)="supprimer(facture)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="summary">
          <div class="summary-item">
            <span>Total en attente:</span>
            <span class="amount">{{ getTotalByStatus('EN_ATTENTE') }}€</span>
          </div>
          <div class="summary-item">
            <span>Total payé:</span>
            <span class="amount paid">{{ getTotalByStatus('PAYEE') }}€</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .factures-container { padding: 20px; background: white; border-radius: 8px; }
    h3 { color: #1565C0; margin-bottom: 20px; font-size: 20px; font-weight: 700; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; }
    .filter-btn { padding: 10px 20px; border: 2px solid #e0e0e0; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .filter-btn.active { background: #1565C0; color: white; border-color: #1565C0; }
    .empty { text-align: center; color: #999; padding: 40px 20px; }
    .table-wrapper { overflow-x: auto; margin-bottom: 20px; }
    .factures-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .factures-table thead { background: #f5f9ff; border-bottom: 2px solid #e0e0e0; }
    .factures-table th { padding: 12px; text-align: left; font-weight: 700; color: #1565C0; text-transform: uppercase; }
    .factures-table td { padding: 12px; border-bottom: 1px solid #f0f0f0; }
    .factures-table tbody tr:hover { background: #f9f9f9; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge.en_attente { background: #fff3e0; color: #FF9800; }
    .badge.payee { background: #e8f5e9; color: #4CAF50; }
    .actions-cell { display: flex; gap: 8px; }
    .summary { background: #f5f9ff; padding: 15px; border-radius: 6px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .summary-item { display: flex; justify-content: space-between; align-items: center; }
    .amount { font-size: 18px; font-weight: 700; color: #FF9800; }
    .amount.paid { color: #4CAF50; }
  `]
})
export class Factures implements OnInit {
  factures: any[] = [];
  filterStatus = 'EN_ATTENTE';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadFactures(); }

  // ✅ GET depuis backend
  loadFactures() {
    this.http.get<any[]>(API).subscribe({
      next: (data) => this.factures = data,
      error: () => {
        const stored = localStorage.getItem('factures');
        this.factures = stored ? JSON.parse(stored) : [];
      }
    });
  }

  get facturesFiltrees(): any[] {
    return this.factures.filter((f: any) => f.statut === this.filterStatus);
  }

  getCountByStatus(status: string): number {
    return this.factures.filter((f: any) => f.statut === status).length;
  }

  getTotalByStatus(status: string): number {
    return this.factures
      .filter((f: any) => f.statut === status)
      .reduce((sum: number, f: any) => sum + (f.montantHT || f.montant || 0), 0);
  }

  // ✅ PUT statut → PAYEE
  marquerPayee(facture: any) {
    this.http.put(`${API}/${facture.id}/statut?statut=PAYEE`, {}).subscribe({
      next: () => {
        facture.statut = 'PAYEE';
        alert('✅ Facture marquée comme payée !');
      },
      error: () => alert('❌ Erreur')
    });
  }

  // ✅ DELETE
  supprimer(facture: any) {
    if (confirm('Supprimer cette facture ?')) {
      this.http.delete(`${API}/${facture.id}`).subscribe({
        next: () => this.factures = this.factures.filter((f: any) => f.id !== facture.id),
        error: () => alert('❌ Erreur suppression')
      });
    }
  }
}