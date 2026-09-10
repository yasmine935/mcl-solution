import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let navigateSpy: ReturnType<typeof vi.fn>;

  const executer = (routeData: Record<string, unknown> = {}) =>
    TestBed.runInInjectionContext(() =>
      authGuard({ data: routeData } as any, {} as any)
    );

  beforeEach(() => {
    localStorage.clear();
    navigateSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigate: navigateSpy } }],
    });
  });

  it('refuse sans session et redirige vers /login', () => {
    expect(executer()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it("refuse un user sans jeton (session forgée ou incomplète)", () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'FERID' }));
    expect(executer()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('accepte user + jeton sur une route sans restriction de rôle', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'TECHNICIEN' }));
    localStorage.setItem('token', 'jeton');
    expect(executer()).toBe(true);
  });

  it('accepte quand le rôle figure dans data.roles', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'KARINE' }));
    localStorage.setItem('token', 'jeton');
    expect(executer({ roles: ['KARINE', 'FERID'] })).toBe(true);
  });

  it("redirige un rôle non autorisé vers son propre dashboard", () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'TECHNICIEN' }));
    localStorage.setItem('token', 'jeton');
    expect(executer({ roles: ['FERID'] })).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard-technicien'], { replaceUrl: true });
  });

  it('refuse un user illisible (JSON corrompu)', () => {
    localStorage.setItem('user', '{pas-du-json');
    localStorage.setItem('token', 'jeton');
    expect(executer()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
