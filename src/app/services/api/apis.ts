import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBase } from './api-base';

/**
 * Services d'API par domaine — un par contrôleur backend.
 * CRUD hérité d'ApiBase (lister / parId / creer / modifier / supprimer)
 * + méthodes nommées pour les sous-routes connues.
 */

@Injectable({ providedIn: 'root' })
export class UtilisateursApi extends ApiBase {
  constructor() { super('utilisateurs'); }

  desactiver(id: number, desactivePar: string): Observable<any> {
    return this.put(`${id}/desactiver`, {}, { desactivePar });
  }

  reactiver(id: number): Observable<any> {
    return this.put(`${id}/reactiver`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class CongesApi extends ApiBase {
  constructor() { super('conges'); }

  changerStatut(id: number, statut: string): Observable<any> {
    return this.put(`${id}/statut`, {}, { statut });
  }

  parEmploye(employeId: number): Observable<any[]> {
    return this.get(`employe/${employeId}`);
  }

  solde(employeId: number): Observable<any> {
    return this.get(`solde/${employeId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class FichesInterventionApi extends ApiBase {
  constructor() { super('fiches-intervention'); }
}

@Injectable({ providedIn: 'root' })
export class TicketsApi extends ApiBase {
  constructor() { super('tickets'); }

  changerStatut(id: number | string, statut: string, valideePar?: string): Observable<any> {
    return this.put(`${id}/statut`, {}, valideePar ? { statut, valideePar } : { statut });
  }
}

@Injectable({ providedIn: 'root' })
export class ReclamationsApi extends ApiBase {
  constructor() { super('reclamations-sse'); }
}

@Injectable({ providedIn: 'root' })
export class TicketsClientApi extends ApiBase {
  constructor() { super('tickets-client'); }

  // Décisions des valideurs (le service backend applique le cycle de vie + « premier qui prend »)
  valider(id: number, commentaire?: string): Observable<any> { return this.put(`${id}/valider`, { commentaire }); }
  rejeter(id: number, commentaire?: string): Observable<any> { return this.put(`${id}/rejeter`, { commentaire }); }
  prendreEnCharge(id: number): Observable<any> { return this.put(`${id}/prendre-en-charge`, {}); }
  resoudre(id: number): Observable<any> { return this.put(`${id}/resoudre`, {}); }
  cloturer(id: number): Observable<any> { return this.put(`${id}/cloturer`, {}); }

  // Timeline (historique + échanges) et ajout de commentaire
  evenements(id: number): Observable<any[]> { return this.get(`${id}/evenements`); }
  commenter(id: number, contenu: string): Observable<any> { return this.post(`${id}/commentaires`, { contenu }); }
}

@Injectable({ providedIn: 'root' })
export class MinutesSecuriteApi extends ApiBase {
  constructor() { super('minutes-securite'); }

  marquerLu(id: number): Observable<any> {
    return this.put(`${id}/lu`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class MessagesAbyApi extends ApiBase {
  constructor() { super('messages-aby'); }

  replies(id: number | string): Observable<any[]> {
    return this.get(`${id}/replies`);
  }
}

@Injectable({ providedIn: 'root' })
export class TachesApi extends ApiBase {
  constructor() { super('taches'); }
}

@Injectable({ providedIn: 'root' })
export class CategoriesTachesApi extends ApiBase {
  constructor() { super('categories-taches'); }
}

@Injectable({ providedIn: 'root' })
export class ClientsApi extends ApiBase {
  constructor() { super('clients'); }
}

@Injectable({ providedIn: 'root' })
export class StockApi extends ApiBase {
  constructor() { super('stock'); }
}

@Injectable({ providedIn: 'root' })
export class CommandesApi extends ApiBase {
  constructor() { super('commandes'); }
}

@Injectable({ providedIn: 'root' })
export class VoituresApi extends ApiBase {
  constructor() { super('voitures'); }
}

@Injectable({ providedIn: 'root' })
export class VisiteursApi extends ApiBase {
  constructor() { super('visiteurs'); }
}

@Injectable({ providedIn: 'root' })
export class JournalApi extends ApiBase {
  constructor() { super('journal'); }
}

@Injectable({ providedIn: 'root' })
export class PlanningApi extends ApiBase {
  constructor() { super('planning'); }
}

@Injectable({ providedIn: 'root' })
export class DemandesApproApi extends ApiBase {
  constructor() { super('demandes-appro'); }
}

@Injectable({ providedIn: 'root' })
export class ArticlesAttenteApi extends ApiBase {
  constructor() { super('articles-attente'); }

  parUtilisateur(utilisateurId: number): Observable<any[]> {
    return this.get(`utilisateur/${utilisateurId}`);
  }
}
