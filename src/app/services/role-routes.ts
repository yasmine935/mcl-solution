// Rôles fonctionnels de l'application et leur dashboard.
// Un rôle décrit une fonction (ADMINISTRATEUR, RH…), jamais une personne :
// les personnes sont affectées à un rôle dans la gestion des employés.
// Le backend migre automatiquement les anciens rôles-prénoms au démarrage (RoleMigration).
export const DASHBOARD_PAR_ROLE: Record<string, string> = {
  TECHNICIEN: '/dashboard-technicien',
  TECHNICIEN_SUP: '/dashboard-kia',
  MANAGER: '/dashboard-aurelien',
  ADMINISTRATEUR: '/dashboard-admin',
  DIRECTION: '/dashboard-essan',
  RH: '/dashboard-karine',
  COMPTABILITE: '/dashboard-naccera',
  SUPPLY_CHAIN: '/dashboard-aby',
  ADMINISTRATIF: '/dashboard-haideh',
  CLIENT: '/dashboard-client',
};

export function dashboardPourRole(role: string | undefined): string {
  return (role && DASHBOARD_PAR_ROLE[role]) || '/login';
}
