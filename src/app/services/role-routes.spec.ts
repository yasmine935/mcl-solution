import { DASHBOARD_PAR_ROLE, dashboardPourRole } from './role-routes';

describe('dashboardPourRole', () => {
  it('renvoie le dashboard du rôle', () => {
    expect(dashboardPourRole('ADMINISTRATEUR')).toBe('/dashboard-admin');
    expect(dashboardPourRole('RH')).toBe('/dashboard-karine');
    expect(dashboardPourRole('TECHNICIEN')).toBe('/dashboard-technicien');
    expect(dashboardPourRole('MANAGER')).toBe('/dashboard-aurelien');
    expect(dashboardPourRole('DIRECTION')).toBe('/dashboard-essan');
  });

  it("renvoie /login pour un rôle inconnu, absent ou un ancien rôle-prénom", () => {
    expect(dashboardPourRole('INCONNU')).toBe('/login');
    expect(dashboardPourRole(undefined)).toBe('/login');
    expect(dashboardPourRole('')).toBe('/login');
    // Les anciens rôles-prénoms n'existent plus : session périmée → reconnexion
    expect(dashboardPourRole('FERID')).toBe('/login');
    expect(dashboardPourRole('KARINE')).toBe('/login');
  });

  it('couvre tous les rôles du référentiel', () => {
    for (const role of Object.keys(DASHBOARD_PAR_ROLE)) {
      expect(dashboardPourRole(role)).toMatch(/^\/dashboard-/);
    }
  });
});
