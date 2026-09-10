// Correspondance rôle → dashboard.
// Les rôles-prénoms sont conservés tels quels jusqu'à la refonte en rôles
// fonctionnels (phase 3b) : ce fichier est le point unique à modifier.
export const DASHBOARD_PAR_ROLE: Record<string, string> = {
  TECHNICIEN: '/dashboard-technicien',
  TECHNICIEN_SUP: '/dashboard-kia',
  AURELIEN: '/dashboard-aurelien',
  ODILE: '/dashboard-odile',
  FERID: '/dashboard-admin',
  ESSAN: '/dashboard-essan',
  KARINE: '/dashboard-karine',
  HAIDEH: '/dashboard-haideh',
  NACCERA: '/dashboard-naccera',
  ABY: '/dashboard-aby',
  UN: '/dashboard-technicien',
};

export function dashboardPourRole(role: string | undefined): string {
  return (role && DASHBOARD_PAR_ROLE[role]) || '/login';
}
