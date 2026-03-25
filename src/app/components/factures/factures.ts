import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="factures-container">
      <h3>🧾 Factures & Comptabilité</h3>

      <!-- FILTRES -->
      <div class="filters">
        <button 
          [class.active]="filterStatus === 'EN_ATTENTE'"
          (click)="filterStatus = 'EN_ATTENTE'"
          class="filter-btn">
          En attente ({{ getCountByStatus('EN_ATTENTE') }})
        </button>
        <button 
          [class.active]="filterStatus === 'PAYEE'"
          (click)="filterStatus = 'PAYEE'"
          class="filter-btn">
          Payées ({{ getCountByStatus('PAYEE') }})
        </button>
      </div>

      <!-- TABLE FACTURES -->
      @if (facturesFiltrees.length === 0) {
        <p class="empty">Aucune facture à afficher</p>
      } @else {
            <div class="table-wrapper">
          <table class="factures-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (facture of facturesFiltrees; track facture.id) {
                <tr [class.payee]="facture.statut === 'PAYEE'">
                  <td><strong>{{ facture.numero }}</strong></td>
                  <td>{{ facture.client }}</td>
                  <td style="color: #4CAF50; font-weight: 700;">{{ facture.montant }}€</td>
                  <td>{{ facture.date }}</td>
                  <td>
                    <span class="badge" [class.en_attente]="facture.statut === 'EN_ATTENTE'" [class.payee]="facture.statut === 'PAYEE'">
                      {{ facture.statut }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      @if (facture.statut === 'EN_ATTENTE') {
                        <button mat-icon-button color="primary" (click)="marquerPayee(facture)" title="Marquer comme payée">
                          <mat-icon>check_circle</mat-icon>
                        </button>
                      }
                      <button mat-icon-button color="accent" (click)="telecharger(facture)" title="Télécharger">
                        <mat-icon>download</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="supprimer(facture)" title="Supprimer">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- RÉSUMÉ -->
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
    .factures-container {
      padding: 20px;
      background: white;
      border-radius: 8px;
    }

    h3 {
      color: #1565C0;
      margin-bottom: 20px;
      font-size: 20px;
      font-weight: 700;
    }

    .filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .filter-btn {
      padding: 10px 20px;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .filter-btn:hover {
      border-color: #1565C0;
    }

    .filter-btn.active {
      background: #1565C0;
      color: white;
      border-color: #1565C0;
    }

    .empty {
      text-align: center;
      color: #999;
      padding: 40px 20px;
    }

    .table-wrapper {
      overflow-x: auto;
      margin-bottom: 20px;
    }

    .factures-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .factures-table thead {
      background: #f5f9ff;
      border-bottom: 2px solid #e0e0e0;
    }

    .factures-table th {
      padding: 12px;
      text-align: left;
      font-weight: 700;
      color: #1565C0;
      text-transform: uppercase;
    }

    .factures-table td {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .factures-table tbody tr:hover {
      background: #f9f9f9;
    }

    .factures-table tbody tr.payee {
      opacity: 0.7;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge.en_attente {
      background: #fff3e0;
      color: #FF9800;
    }

    .badge.payee {
      background: #e8f5e9;
      color: #4CAF50;
    }

    .actions-cell {
      display: flex;
      gap: 8px;
    }

    .summary {
      background: #f5f9ff;
      padding: 15px;
      border-radius: 6px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-item span:first-child {
      font-weight: 600;
      color: #666;
    }

    .amount {
      font-size: 18px;
      font-weight: 700;
      color: #FF9800;
    }

    .amount.paid {
      color: #4CAF50;
    }
  `]
})
export class Factures implements OnInit {
  factures: any[] = [];
  filterStatus = 'EN_ATTENTE';

  ngOnInit() {
    this.loadFactures();
  }

  loadFactures() {
    const stored = localStorage.getItem('factures');
    this.factures = stored ? JSON.parse(stored) : [];
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
      .reduce((sum: number, f: any) => sum + (f.montant || 0), 0);
  }

  marquerPayee(facture: any) {
    facture.statut = 'PAYEE';
    localStorage.setItem('factures', JSON.stringify(this.factures));
    alert('✅ Facture marquée comme payée !');
    this.loadFactures();
  }

  telecharger(facture: any) {
    // ✅ CRÉER UN PDF SIMPLE (simulation)
    const contenu = `
FACTURE
=======
Numéro: ${facture.numero}
Date: ${facture.date}

Client: ${facture.client}
Montant: ${facture.montant}€
Statut: ${facture.statut}

------ Fin de facture ------
    `;
    
    const blob = new Blob([contenu], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = facture.numero + '.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  supprimer(facture: any) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.factures = this.factures.filter((f: any) => f.id !== facture.id);
      localStorage.setItem('factures', JSON.stringify(this.factures));
      this.loadFactures();
    }
  }
}