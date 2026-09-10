import { DASHBOARD_PAR_ROLE, dashboardPourRole } from './role-routes';

describe('dashboardPourRole', () => {
  it('renvoie le dashboard du rôle', () => {
    expect(dashboardPourRole('FERID')).toBe('/dashboard-admin');
    expect(dashboardPourRole('KARINE')).toBe('/dashboard-karine');
    expect(dashboardPourRole('TECHNICIEN')).toBe('/dashboard-technicien');
    expect(dashboardPourRole('UN')).toBe('/dashboard-technicien');
  });

  it('renvoie /login pour un rôle inconnu ou absent', () => {
    expect(dashboardPourRole('INCONNU')).toBe('/login');
    expect(dashboardPourRole(undefined)).toBe('/login');
    expect(dashboardPourRole('')).toBe('/login');
  });

  it('couvre tous les rôles du référentiel', () => {
    for (const role of Object.keys(DASHBOARD_PAR_ROLE)) {
      expect(dashboardPourRole(role)).toMatch(/^\/dashboard-/);
    }
  });
});
