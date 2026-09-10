import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { apiInterceptor } from './api.interceptor';
import { SERVER_URL } from '../server.config';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    navigateSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('joint le jeton aux requêtes vers notre API', () => {
    localStorage.setItem('token', 'mon-jeton');
    http.get(`${SERVER_URL}/api/conges`).subscribe();

    const req = controller.expectOne(`${SERVER_URL}/api/conges`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mon-jeton');
    req.flush([]);
  });

  it("ne joint JAMAIS le jeton à un domaine tiers", () => {
    localStorage.setItem('token', 'mon-jeton');
    http.get('https://exemple.tiers/api/data').subscribe({ error: () => {} });

    const req = controller.expectOne('https://exemple.tiers/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it("n'ajoute rien sans jeton (visiteur anonyme)", () => {
    http.get(`${SERVER_URL}/api/tickets`).subscribe();

    const req = controller.expectOne(`${SERVER_URL}/api/tickets`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('déconnecte sur 401 quand un jeton était joint (expiré/invalide)', () => {
    localStorage.setItem('user', '{"id":1}');
    localStorage.setItem('token', 'expire');
    http.get(`${SERVER_URL}/api/conges`).subscribe({ error: () => {} });

    controller.expectOne(`${SERVER_URL}/api/conges`).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('ne déconnecte PAS un anonyme qui reçoit un 401 (écran public)', () => {
    http.delete(`${SERVER_URL}/api/tickets/1`).subscribe({ error: () => {} });

    controller.expectOne(`${SERVER_URL}/api/tickets/1`).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('ne déconnecte pas sur un échec de login (mauvais mot de passe)', () => {
    localStorage.setItem('token', 'quelconque');
    http.post(`${SERVER_URL}/api/auth/login`, {}).subscribe({ error: () => {} });

    controller.expectOne(`${SERVER_URL}/api/auth/login`).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBe('quelconque');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("réécrit localhost:8080 vers SERVER_URL", () => {
    http.get('http://localhost:8080/api/conges').subscribe();
    const req = controller.expectOne(`${SERVER_URL}/api/conges`);
    req.flush([]);
  });
});
