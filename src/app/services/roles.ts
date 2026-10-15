/**
 * Rôles utilisateur : code technique (stocké en base, utilisé pour les droits)
 * → libellé affiché. Le code ne change jamais ; seul le libellé est présenté à l'écran.
 */
export const ROLES: { value: string; label: string }[] = [
  { value: 'TECHNICIEN', label: 'Technicien' },
  { value: 'TECHNICIEN_SUP', label: 'Directeur des opérations' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
  { value: 'DIRECTION', label: 'Direction' },
  { value: 'RH', label: 'Ressources Humaines' },
  { value: 'COMPTABILITE', label: 'Comptabilité' },
  { value: 'SUPPLY_CHAIN', label: 'Supply Chain' },
  { value: 'ADMINISTRATIF', label: 'Direction Administrative' }
];

/** Libellé affiché d'un rôle (le code tel quel s'il est inconnu, ex. CLIENT). */
export function libelleRole(role: string | null | undefined): string {
  return ROLES.find(r => r.value === role)?.label ?? (role || '');
}
