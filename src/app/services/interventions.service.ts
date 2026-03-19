import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InterventionsService {
  private storageKey = 'interventions';

  constructor(private http: HttpClient) {
    this.initializeStorage();
  }

  private initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  creerIntervention(data: any): Observable<any> {
    const interventions = this.getInterventionsFromStorage();
    const newIntervention = {
      id: Date.now(),
      ...data,
      dateCreation: new Date().toISOString(),
      statut: 'EN_PREPARATION'
    };
    interventions.push(newIntervention);
    localStorage.setItem(this.storageKey, JSON.stringify(interventions));
    console.log('Intervention créée:', newIntervention);
    return of(newIntervention);
  }

  getInterventions(): Observable<any[]> {
    const interventions = this.getInterventionsFromStorage();
    return of(interventions);
  }

  getIntervention(id: number): Observable<any> {
    const interventions = this.getInterventionsFromStorage();
    const intervention = interventions.find(i => i.id === id);
    return of(intervention);
  }

  getInterventionsTechnicien(technicienId: number): Observable<any[]> {
    const interventions = this.getInterventionsFromStorage();
    return of(interventions.filter(i => i.technicienId === technicienId));
  }

  updateIntervention(id: number, data: any): Observable<any> {
    const interventions = this.getInterventionsFromStorage();
    const index = interventions.findIndex(i => i.id === id);
    if (index > -1) {
      interventions[index] = { ...interventions[index], ...data };
      localStorage.setItem(this.storageKey, JSON.stringify(interventions));
    }
    return of(interventions[index]);
  }

  envoyerAuTechnicien(id: number, technicienId: number): Observable<any> {
    const interventions = this.getInterventionsFromStorage();
    const index = interventions.findIndex(i => i.id === id);
    if (index > -1) {
      interventions[index].statut = 'EN_COURS';
      interventions[index].technicienId = technicienId;
      localStorage.setItem(this.storageKey, JSON.stringify(interventions));
    }
    return of(interventions[index]);
  }

  completerIntervention(id: number, data: any): Observable<any> {
    const interventions = this.getInterventionsFromStorage();
    const index = interventions.findIndex(i => i.id === id);
    if (index > -1) {
      interventions[index] = { ...interventions[index], ...data, statut: 'COMPLETEE' };
      localStorage.setItem(this.storageKey, JSON.stringify(interventions));
    }
    return of(interventions[index]);
  }

  getClients(): Observable<any[]> {
    const clients = [
      { id: 1, nom: 'Client A' },
      { id: 2, nom: 'Client B' },
      { id: 3, nom: 'Client C' },
      { id: 4, nom: 'Client D' }
    ];
    return of(clients);
  }

  getTechniciens(): Observable<any[]> {
    const techniciensMock = [
      { id: 1, prenom: 'Test', nom: 'Technicien', role: 'TECHNICIEN' },
      { id: 2, prenom: 'Tech', nom: 'Support', role: 'TECHNICIEN' }
    ];
    return of(techniciensMock);
  }

  private getInterventionsFromStorage(): any[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
}