import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth } from './auth';
import { SERVER_URL } from '../server.config';

describe('Auth', () => {
  let service: Auth;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Auth);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('login stocke le jeton mais pas encore l\'utilisateur', () => {
    service.login('jean', 'secret123').subscribe();

    const req = controller.expectOne(`${SERVER_URL}/api/auth/login`);
    expect(req.request.body).toEqual({ username: 'jean', password: 'secret123' });
    req.flush({ token: 'jwt-abc', user: { id: 1, role: 'TECHNICIEN' } });

    expect(localStorage.getItem('token')).toBe('jwt-abc');
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('persisterSession enregistre l\'utilisateur sans son mot de passe', () => {
    service.persisterSession({ id: 1, role: 'RH', password: 'jamais' } as any);
    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.role).toBe('RH');
    expect(stored.password).toBeUndefined();
  });

  it('utilisateurCourant exige user ET jeton', () => {
    expect(service.utilisateurCourant()).toBeNull();

    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'RH' }));
    expect(service.utilisateurCourant()).toBeNull(); // pas de jeton

    localStorage.setItem('token', 'jwt');
    expect(service.utilisateurCourant()?.role).toBe('RH');
  });

  it('deconnecter purge la session', () => {
    localStorage.setItem('user', '{"id":1}');
    localStorage.setItem('token', 'jwt');
    service.deconnecter();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('changePassword envoie le mot de passe actuel et le nouveau', () => {
    service.changePassword('actuel', 'nouveau-mdp').subscribe();
    const req = controller.expectOne(`${SERVER_URL}/api/auth/change-password`);
    expect(req.request.body).toEqual({ currentPassword: 'actuel', newPassword: 'nouveau-mdp' });
    req.flush('ok');
  });
});
