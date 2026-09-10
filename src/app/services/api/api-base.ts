import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SERVER_URL } from '../../server.config';

export type ParamsHttp = Record<string, string | number | boolean>;

/**
 * Socle des services d'API : CRUD standard + accès aux sous-routes.
 * Les composants ne construisent JAMAIS d'URL eux-mêmes — toute route
 * passe par le service du domaine concerné.
 */
export abstract class ApiBase {
  protected readonly http = inject(HttpClient);
  readonly base: string;

  protected constructor(ressource: string) {
    this.base = `${SERVER_URL}/api/${ressource}`;
  }

  lister<T = any>(): Observable<T[]> {
    return this.http.get<T[]>(this.base);
  }

  parId<T = any>(id: number | string): Observable<T> {
    return this.http.get<T>(`${this.base}/${id}`);
  }

  creer<T = any>(body: unknown): Observable<T> {
    return this.http.post<T>(this.base, body);
  }

  modifier<T = any>(id: number | string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${id}`, body);
  }

  supprimer(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── Sous-routes non couvertes par une méthode nommée du service ──
  // (restent centralisées ici : pas d'URL en dur dans les composants)

  get<T = any>(chemin: string, params?: ParamsHttp): Observable<T> {
    return this.http.get<T>(this.url(chemin), { params: this.versParams(params) });
  }

  post<T = any>(chemin: string, body: unknown, params?: ParamsHttp): Observable<T> {
    return this.http.post<T>(this.url(chemin), body, { params: this.versParams(params) });
  }

  put<T = any>(chemin: string, body: unknown, params?: ParamsHttp): Observable<T> {
    return this.http.put<T>(this.url(chemin), body, { params: this.versParams(params) });
  }

  delete<T = any>(chemin: string, params?: ParamsHttp): Observable<T> {
    return this.http.delete<T>(this.url(chemin), { params: this.versParams(params) });
  }

  /** Variantes pour les endpoints qui répondent en texte brut. */
  postTexte(chemin: string, body: unknown): Observable<string> {
    return this.http.post(this.url(chemin), body, { responseType: 'text' });
  }

  putTexte(chemin: string, body: unknown, params?: ParamsHttp): Observable<string> {
    return this.http.put(this.url(chemin), body, { responseType: 'text', params: this.versParams(params) });
  }

  private url(chemin: string): string {
    return chemin ? `${this.base}/${chemin}` : this.base;
  }

  private versParams(p?: ParamsHttp): HttpParams | undefined {
    if (!p) return undefined;
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(p)) {
      params = params.set(cle, String(valeur));
    }
    return params;
  }
}
